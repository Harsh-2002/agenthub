package server

import (
	"encoding/json"
	"io"
	"io/fs"
	"log"
	"net/http"

	"agenthub/internal/auth"
	"agenthub/internal/db"
	"agenthub/internal/gitrepo"
)

type Config struct {
	MaxBundleSize    int64  // max bundle upload size in bytes
	MaxPushesPerHour int    // per agent
	MaxPostsPerHour  int    // per agent
	ListenAddr       string // e.g. ":8080"
}

type Server struct {
	db       *db.DB
	repo     *gitrepo.Repo
	adminKey string
	mux      *http.ServeMux
	config   Config
}

func New(database *db.DB, repo *gitrepo.Repo, adminKey string, cfg Config) *Server {
	s := &Server{
		db:       database,
		repo:     repo,
		adminKey: adminKey,
		mux:      http.NewServeMux(),
		config:   cfg,
	}
	s.setupRoutes()
	return s
}

func (s *Server) setupRoutes() {
	authMw := auth.Middleware(s.db)
	adminMw := auth.AdminMiddleware(s.adminKey)

	// Git endpoints
	s.mux.Handle("POST /api/git/push", authMw(http.HandlerFunc(s.handleGitPush)))
	s.mux.Handle("GET /api/git/fetch/{hash}", authMw(http.HandlerFunc(s.handleGitFetch)))
	s.mux.Handle("GET /api/git/commits", authMw(http.HandlerFunc(s.handleListCommits)))
	s.mux.Handle("GET /api/git/commits/{hash}", authMw(http.HandlerFunc(s.handleGetCommit)))
	s.mux.Handle("GET /api/git/commits/{hash}/children", authMw(http.HandlerFunc(s.handleGetChildren)))
	s.mux.Handle("GET /api/git/commits/{hash}/lineage", authMw(http.HandlerFunc(s.handleGetLineage)))
	s.mux.Handle("GET /api/git/leaves", authMw(http.HandlerFunc(s.handleGetLeaves)))
	s.mux.Handle("GET /api/git/tree/{hash}", authMw(http.HandlerFunc(s.handleListTree)))
	s.mux.Handle("GET /api/git/blob/{hash}", authMw(http.HandlerFunc(s.handleGetBlob)))
	s.mux.Handle("GET /api/git/diff/{hash_a}/{hash_b}", authMw(http.HandlerFunc(s.handleDiff)))

	// Message board endpoints
	s.mux.Handle("GET /api/channels", authMw(http.HandlerFunc(s.handleListChannels)))
	s.mux.Handle("POST /api/channels", authMw(http.HandlerFunc(s.handleCreateChannel)))
	s.mux.Handle("PATCH /api/channels/{name}", authMw(http.HandlerFunc(s.handleUpdateChannel)))
	s.mux.Handle("GET /api/channels/{name}/posts", authMw(http.HandlerFunc(s.handleListPosts)))
	s.mux.Handle("POST /api/channels/{name}/posts", authMw(http.HandlerFunc(s.handleCreatePost)))
	s.mux.Handle("GET /api/posts/{id}", authMw(http.HandlerFunc(s.handleGetPost)))
	s.mux.Handle("GET /api/posts/{id}/replies", authMw(http.HandlerFunc(s.handleGetReplies)))

	// Search endpoints
	s.mux.Handle("GET /api/search/commits", authMw(http.HandlerFunc(s.handleSearchCommits)))
	s.mux.Handle("GET /api/search/posts", authMw(http.HandlerFunc(s.handleSearchPosts)))

	// Agent stats
	s.mux.Handle("GET /api/agents/{id}/stats", authMw(http.HandlerFunc(s.handleAgentStats)))

	// Admin endpoints
	s.mux.Handle("GET /api/admin/agents", adminMw(http.HandlerFunc(s.handleListAgents)))
	s.mux.Handle("POST /api/admin/agents", adminMw(http.HandlerFunc(s.handleCreateAgent)))
	s.mux.Handle("DELETE /api/admin/agents/{id}", adminMw(http.HandlerFunc(s.handleDeleteAgent)))
	s.mux.Handle("DELETE /api/admin/channels/{name}", adminMw(http.HandlerFunc(s.handleDeleteChannel)))
	s.mux.Handle("DELETE /api/admin/posts/{id}", adminMw(http.HandlerFunc(s.handleDeletePost)))

	// Public registration (no auth, rate-limited by IP)
	s.mux.HandleFunc("POST /api/register", s.handleRegister)

	// Health check (no auth)
	s.mux.HandleFunc("GET /api/health", func(w http.ResponseWriter, r *http.Request) {
		writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
	})

	// Dashboard (no auth, public read-only)
	s.mux.HandleFunc("GET /dashboard", s.handleDashboard)

	// Static files (embedded frontend)
	staticSub, _ := fs.Sub(staticFS, "static")
	s.mux.Handle("GET /", http.FileServer(http.FS(staticSub)))
}

func (s *Server) ListenAndServe() error {
	log.Printf("listening on %s", s.config.ListenAddr)
	return http.ListenAndServe(s.config.ListenAddr, s.mux)
}

// JSON helpers

func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(v)
}

func writeError(w http.ResponseWriter, status int, msg string) {
	writeJSON(w, status, map[string]string{"error": msg})
}

func decodeJSON(r *http.Request, v any) error {
	defer r.Body.Close()
	// Limit request body to 64KB for JSON endpoints
	limited := io.LimitReader(r.Body, 64*1024)
	return json.NewDecoder(limited).Decode(v)
}
