import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import {
  MessageSquare, Plus, Trash, Clock, ArrowLeft, Check, Users,
  BarChart2, AlertTriangle, X, Loader2, Send
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { api } from "@/lib/api"

interface ForumComment {
  id: string
  post_id: string
  author_id: string
  author_name?: string | null
  content: string
  created_at: string
}

interface Post {
  id: string
  building_id: string
  author_id: string
  author_name?: string | null
  title: string
  content: string
  comment_count: number
  created_at: string
  updated_at: string
}

interface PollOption {
  id: string
  poll_id: string
  option_text: string
  vote_count: number
}

interface Poll {
  id: string
  building_id: string
  creator_id: string
  creator_name?: string | null
  question: string
  is_active: boolean
  expires_at?: string | null
  created_at: string
  updated_at: string
  options: PollOption[]
  voted_option_id?: string | null
}

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

const getInitials = (name?: string | null) => {
  if (!name) return "?"
  return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
}

const Community = () => {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<"discussion" | "polls">("discussion")
  const [posts, setPosts] = useState<Post[]>([])
  const [polls, setPolls] = useState<Poll[]>([])
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  // Discussion Expanded View State
  const [selectedPost, setSelectedPost] = useState<Post | null>(null)
  const [selectedPostComments, setSelectedPostComments] = useState<ForumComment[]>([])
  const [commentText, setCommentText] = useState("")
  const [commentSubmitting, setCommentSubmitting] = useState(false)

  // Modals state
  const [isPostModalOpen, setIsPostModalOpen] = useState(false)
  const [postTitle, setPostTitle] = useState("")
  const [postContent, setPostContent] = useState("")
  const [postSubmitting, setPostSubmitting] = useState(false)

  const [isPollModalOpen, setIsPollModalOpen] = useState(false)
  const [pollQuestion, setPollQuestion] = useState("")
  const [pollOptions, setPollOptions] = useState<string[]>(["", ""])
  const [pollSubmitting, setPollSubmitting] = useState(false)

  const loadData = () => {
    setLoading(true)
    setError("")
    Promise.all([
      api.auth.me(),
      api.forum.list(),
      api.polls.list()
    ])
      .then(([me, forumList, pollsList]) => {
        setCurrentUser(me)
        setPosts(forumList)
        setPolls(pollsList)
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Failed to load community hub")
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadData()
  }, [])

  // Handle post expansion
  const handleViewPost = (postId: string) => {
    api.forum.get(postId)
      .then((detail) => {
        setSelectedPost(detail)
        setSelectedPostComments(detail.comments || [])
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Failed to load post details")
      })
  }

  // Handle post creation
  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault()
    setPostSubmitting(true)
    setError("")
    try {
      await api.forum.create({
        title: postTitle,
        content: postContent
      })
      setPostTitle("")
      setPostContent("")
      setIsPostModalOpen(false)
      // Reload posts
      const forumList = await api.forum.list()
      setPosts(forumList)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to publish post")
    } finally {
      setPostSubmitting(false)
    }
  }

  // Handle post deletion
  const handleDeletePost = async (postId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm("Are you sure you want to delete this discussion thread?")) return
    try {
      await api.forum.delete(postId)
      if (selectedPost?.id === postId) {
        setSelectedPost(null)
      }
      // Reload posts
      const forumList = await api.forum.list()
      setPosts(forumList)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete post")
    }
  }

  // Handle comment submit
  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedPost || !commentText.trim()) return
    setCommentSubmitting(true)
    try {
      const newComment = await api.forum.comment(selectedPost.id, commentText)
      setSelectedPostComments(prev => [...prev, newComment])
      setCommentText("")
      // Reload comments in background
      handleViewPost(selectedPost.id)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to post reply")
    } finally {
      setCommentSubmitting(false)
    }
  }

  // Handle poll creation
  const handleCreatePoll = async (e: React.FormEvent) => {
    e.preventDefault()
    setPollSubmitting(true)
    setError("")
    const filteredOptions = pollOptions.map(o => o.trim()).filter(Boolean)
    if (filteredOptions.length < 2) {
      setError("Please provide at least 2 non-empty options.")
      setPollSubmitting(false)
      return
    }
    try {
      await api.polls.create({
        question: pollQuestion,
        options: filteredOptions
      })
      setPollQuestion("")
      setPollOptions(["", ""])
      setIsPollModalOpen(false)
      // Reload polls
      const pollsList = await api.polls.list()
      setPolls(pollsList)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create poll")
    } finally {
      setPollSubmitting(false)
    }
  }

  // Add Option to Create Poll Form
  const handleAddPollOption = () => {
    setPollOptions(prev => [...prev, ""])
  }

  // Remove Option from Create Poll Form
  const handleRemovePollOption = (index: number) => {
    if (pollOptions.length <= 2) return
    setPollOptions(prev => prev.filter((_, i) => i !== index))
  }

  // Handle cast vote
  const handleCastVote = async (pollId: string, optionId: string) => {
    try {
      const updatedPoll = await api.polls.vote(pollId, optionId)
      setPolls(prev => prev.map(p => p.id === pollId ? updatedPoll : p))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to cast vote")
    }
  }

  // Handle close poll
  const handleClosePoll = async (pollId: string) => {
    if (!confirm("Are you sure you want to close this poll? Voting will end immediately.")) return
    try {
      const updatedPoll = await api.polls.close(pollId)
      setPolls(prev => prev.map(p => p.id === pollId ? updatedPoll : p))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to close poll")
    }
  }

  if (loading) {
    return (
      <div className="p-4 md:p-8 max-w-7xl mx-auto w-full space-y-6 animate-pulse">
        <div className="h-12 bg-white/5 border border-white/10 rounded-xl w-64" />
        <div className="h-64 bg-white/5 border border-white/10 rounded-xl" />
      </div>
    )
  }

  const isAdmin = currentUser?.role === "admin" || currentUser?.role === "super_admin"

  return (
    <ScrollArea className="h-full overflow-y-auto">
      <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 md:space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white tracking-wide uppercase">Community Hub</h1>
            <p className="text-sm text-slate-400 mt-1 font-light tracking-wider uppercase">
              Interact, vote, and discuss with society residents and staff
            </p>
          </div>
          {!selectedPost && (
            <div className="flex flex-wrap gap-2 w-full sm:w-auto">
              {activeTab === "discussion" ? (
                <Button
                  className="gap-2 font-bold tracking-widest uppercase bg-primary text-black hover:bg-primary/90 shadow-[0_0_15px_rgba(0,240,255,0.3)] border border-primary transition-all w-full sm:w-auto"
                  onClick={() => setIsPostModalOpen(true)}
                >
                  <Plus className="h-4 w-4" /> Start Discussion
                </Button>
              ) : isAdmin ? (
                <Button
                  className="gap-2 font-bold tracking-widest uppercase bg-primary text-black hover:bg-primary/90 shadow-[0_0_15px_rgba(0,240,255,0.3)] border border-primary transition-all w-full sm:w-auto"
                  onClick={() => setIsPollModalOpen(true)}
                >
                  <Plus className="h-4 w-4" /> Create Poll
                </Button>
              ) : null}
            </div>
          )}
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-red-500/20 border border-red-500/50 text-red-200 text-sm font-medium flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 shrink-0 text-red-400" />
            {error}
          </div>
        )}

        {/* Tab Selection */}
        {!selectedPost && (
          <div className="flex bg-white/5 border border-white/10 p-1 rounded-xl w-full sm:w-80">
            <button
              onClick={() => setActiveTab("discussion")}
              className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${
                activeTab === "discussion"
                  ? "bg-primary text-black shadow-[0_0_10px_rgba(0,240,255,0.4)]"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Discussion Board
            </button>
            <button
              onClick={() => setActiveTab("polls")}
              className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${
                activeTab === "polls"
                  ? "bg-primary text-black shadow-[0_0_10px_rgba(0,240,255,0.4)]"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Surveys & Polls
            </button>
          </div>
        )}

        {/* ================= TAB 1: DISCUSSION BOARD ================= */}
        {activeTab === "discussion" && (
          <div className="space-y-6">
            {selectedPost ? (
              // Extended Post Detail & Comments View
              <div className="space-y-6">
                <Button variant="ghost" className="gap-2 text-slate-400 hover:text-white" onClick={() => { setSelectedPost(null); loadData() }}>
                  <ArrowLeft className="h-4 w-4" /> Back to Discussions
                </Button>

                <Card className="glass-card border-primary/20">
                  <CardContent className="p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 border border-primary/30 shadow-[0_0_10px_rgba(0,240,255,0.1)]">
                          <AvatarFallback className="bg-primary/20 text-primary text-xs font-bold">
                            {getInitials(selectedPost.author_name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-bold text-white text-sm tracking-wide">{selectedPost.author_name || "Anonymous"}</p>
                          <p className="text-[10px] text-slate-400 font-mono mt-0.5">{formatDate(selectedPost.created_at)}</p>
                        </div>
                      </div>
                      {(selectedPost.author_id === currentUser?.id || isAdmin) && (
                        <Button
                          variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-red-400"
                          onClick={(e) => handleDeletePost(selectedPost.id, e)}
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-white tracking-wide">{selectedPost.title}</h2>
                      <p className="text-slate-300 text-sm font-light mt-3 whitespace-pre-wrap leading-relaxed">{selectedPost.content}</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Comments Section */}
                <div className="space-y-4">
                  <h3 className="font-bold text-white uppercase tracking-wider text-xs">Replies ({selectedPostComments.length})</h3>

                  {selectedPostComments.length === 0 ? (
                    <Card className="glass-card">
                      <CardContent className="py-8 flex flex-col items-center text-slate-400">
                        <p className="text-sm font-light">No comments yet. Start the conversation!</p>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="space-y-3">
                      {selectedPostComments.map(comment => (
                        <Card key={comment.id} className="glass-card">
                          <CardContent className="p-4 space-y-2">
                            <div className="flex items-center gap-2">
                              <Avatar className="h-6.5 w-6.5 border border-primary/20">
                                <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-bold">
                                  {getInitials(comment.author_name)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <span className="font-bold text-white text-xs tracking-wide">{comment.author_name || "Anonymous"}</span>
                                <span className="text-[9px] text-slate-500 font-mono ml-2">{formatDate(comment.created_at)}</span>
                              </div>
                            </div>
                            <p className="text-slate-300 text-xs font-light pl-8 leading-relaxed">{comment.content}</p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}

                  {/* Add Comment Form */}
                  <Card className="glass-card bg-black/40">
                    <CardContent className="p-4">
                      <form onSubmit={handleCommentSubmit} className="flex gap-2">
                        <Input
                          placeholder="Write a reply..."
                          required
                          value={commentText}
                          onChange={e => setCommentText(e.target.value)}
                          className="bg-black/20 border-white/10 text-white placeholder:text-slate-600 focus-visible:ring-primary focus-visible:border-primary flex-1"
                        />
                        <Button type="submit" disabled={commentSubmitting} aria-label="Send" className="bg-primary text-black hover:bg-primary/95 flex items-center justify-center h-10 w-10 p-0 shadow-[0_0_10px_rgba(0,240,255,0.2)]">
                          {commentSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                        </Button>
                      </form>
                    </CardContent>
                  </Card>
                </div>
              </div>
            ) : (
              // Discussion list/feed
              <div className="space-y-4">
                {posts.length === 0 ? (
                  <Card className="glass-card">
                    <CardContent className="py-16 flex flex-col items-center text-slate-400">
                      <div className="w-16 h-16 mb-4 bg-primary/20 border border-primary/50 shadow-[0_0_15px_rgba(0,240,255,0.3)] rounded-2xl flex items-center justify-center">
                        <MessageSquare className="h-8 w-8 text-primary drop-shadow-[0_0_5px_rgba(0,240,255,0.8)]" />
                      </div>
                      <p className="font-bold text-lg mb-2 text-white tracking-widest uppercase">Discussion Feed Empty</p>
                      <p className="text-sm mb-6 font-light text-center">Be the first to post a question or topic!</p>
                      <Button className="bg-primary text-black hover:bg-primary/95" onClick={() => setIsPostModalOpen(true)}>
                        Start Discussion
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 gap-4">
                    {posts.map(post => (
                      <Card
                        key={post.id}
                        onClick={() => handleViewPost(post.id)}
                        className="glass-card hover:-translate-y-0.5 hover:border-primary/40 cursor-pointer transition-all"
                      >
                        <CardContent className="p-5 flex flex-col justify-between h-full gap-4">
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Avatar className="h-8 w-8 border border-white/10">
                                  <AvatarFallback className="bg-primary/20 text-primary text-[10px] font-bold">
                                    {getInitials(post.author_name)}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="font-bold text-white text-xs tracking-wide">{post.author_name || "Anonymous"}</p>
                                  <p className="text-[9px] text-slate-500 font-mono mt-0.5">{formatDate(post.created_at)}</p>
                                </div>
                              </div>
                              {(post.author_id === currentUser?.id || isAdmin) && (
                                <Button
                                  variant="ghost" size="icon" className="h-7 w-7 text-slate-500 hover:text-red-400"
                                  onClick={(e) => handleDeletePost(post.id, e)}
                                >
                                  <Trash className="h-3.5 w-3.5" />
                                </Button>
                              )}
                            </div>
                            <div>
                              <h3 className="font-bold text-white text-base tracking-wide line-clamp-1">{post.title}</h3>
                              <p className="text-slate-400 text-xs font-light mt-1.5 line-clamp-2 leading-relaxed">{post.content}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 text-[10px] text-primary uppercase font-bold tracking-wider pt-3 border-t border-white/5">
                            <MessageSquare className="h-3.5 w-3.5" />
                            <span>{post.comment_count} Repl{post.comment_count !== 1 ? "ies" : "y"}</span>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ================= TAB 2: SURVEYS & POLLS ================= */}
        {activeTab === "polls" && (
          <div className="space-y-4">
            {polls.length === 0 ? (
              <Card className="glass-card">
                <CardContent className="py-16 flex flex-col items-center text-slate-400">
                  <div className="w-16 h-16 mb-4 bg-primary/20 border border-primary/50 shadow-[0_0_15px_rgba(0,240,255,0.3)] rounded-2xl flex items-center justify-center">
                    <BarChart2 className="h-8 w-8 text-primary drop-shadow-[0_0_5px_rgba(0,240,255,0.8)]" />
                  </div>
                  <p className="font-bold text-lg mb-2 text-white tracking-widest uppercase">No Active Surveys</p>
                  <p className="text-sm mb-6 font-light text-center">There are no surveys or opinion polls active right now.</p>
                  {isAdmin && (
                    <Button className="bg-primary text-black hover:bg-primary/95" onClick={() => setIsPollModalOpen(true)}>
                      Create Poll
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {polls.map(poll => {
                  const totalVotes = poll.options.reduce((sum, opt) => sum + opt.vote_count, 0)
                  const hasVoted = !!poll.voted_option_id
                  const isClosed = !poll.is_active

                  return (
                    <Card key={poll.id} className={`glass-card relative border ${isClosed ? "border-white/5" : "border-primary/20"}`}>
                      <CardContent className="p-6 space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] uppercase font-bold tracking-widest font-mono text-slate-400">
                            By {poll.creator_name || "Admin"}
                          </span>
                          <Badge variant="secondary" className={`border-none text-[9px] font-bold uppercase tracking-wide px-2 py-0.5 ${
                            isClosed
                              ? "bg-white/5 text-slate-400"
                              : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 shadow-[0_0_10px_rgba(16,185,129,0.1)]"
                          }`}>
                            {isClosed ? "Closed" : "Active"}
                          </Badge>
                        </div>

                        <h3 className="font-bold text-white text-base tracking-wide leading-snug">{poll.question}</h3>

                        {/* Options List */}
                        <div className="space-y-3 pt-2">
                          {poll.options.map(opt => {
                            const isVotedOption = poll.voted_option_id === opt.id
                            const pct = totalVotes > 0 ? Math.round((opt.vote_count / totalVotes) * 100) : 0

                            if (hasVoted || isClosed) {
                              // Display Voting Results (progress bar)
                              return (
                                <div key={opt.id} className="space-y-1 relative">
                                  <div className="flex items-center justify-between text-xs font-semibold z-10 relative px-2.5 py-2">
                                    <span className="text-slate-200 flex items-center gap-1.5 font-light">
                                      {isVotedOption && <Check className="h-4.5 w-4.5 text-primary drop-shadow-[0_0_5px_rgba(0,240,255,0.8)]" />}
                                      {opt.option_text}
                                    </span>
                                    <span className="font-mono text-primary">{pct}% <span className="text-slate-500 font-light font-sans ml-1">({opt.vote_count})</span></span>
                                  </div>
                                  {/* Progress bar container */}
                                  <div className="h-9 w-full bg-white/5 border border-white/5 rounded-lg overflow-hidden absolute top-0 left-0">
                                    <div
                                      className={`h-full transition-all duration-500 ease-out ${
                                        isVotedOption
                                          ? "bg-primary/20 border-r border-primary/50 shadow-[inset_0_0_10px_rgba(0,240,255,0.2)]"
                                          : "bg-white/5"
                                      }`}
                                      style={{ width: `${pct}%` }}
                                    />
                                  </div>
                                </div>
                              )
                            } else {
                              // Interactive Voting Options
                              return (
                                <Button
                                  key={opt.id}
                                  variant="outline"
                                  className="w-full text-left justify-start font-medium text-xs border-white/10 hover:border-primary/50 hover:bg-primary/10 text-slate-300 hover:text-white uppercase tracking-wider py-5"
                                  onClick={() => handleCastVote(poll.id, opt.id)}
                                >
                                  {opt.option_text}
                                </Button>
                              )
                            }
                          })}
                        </div>

                        {/* Poll Footer details */}
                        <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono border-t border-white/5 pt-3">
                          <span>Total: {totalVotes} vote{totalVotes !== 1 ? "s" : ""}</span>
                          {isAdmin && !isClosed && (
                            <Button
                              variant="ghost" size="sm" className="h-6 text-[10px] font-bold text-red-400 hover:text-red-300 hover:bg-red-500/10 uppercase tracking-widest p-0.5"
                              onClick={() => handleClosePoll(poll.id)}
                            >
                              Close Poll
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* ================= MODAL: START DISCUSSION ================= */}
        {isPostModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <Card className="w-full max-w-lg bg-slate-900 border border-white/10 shadow-2xl relative text-white">
              <Button variant="ghost" size="icon" className="absolute right-4 top-4 text-slate-400 hover:text-white" onClick={() => setIsPostModalOpen(false)}>
                <X className="h-5 w-5" />
              </Button>
              <CardHeader>
                <CardTitle className="text-lg font-bold text-white uppercase tracking-wide">Start Discussion Thread</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreatePost} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="postTitle" className="text-slate-300">Topic / Title</Label>
                    <Input
                      id="postTitle"
                      required
                      placeholder="e.g. Garbage disposal collection timings?"
                      className="bg-black/20 border-white/10 text-white placeholder:text-slate-700 focus-visible:ring-primary focus-visible:border-primary"
                      value={postTitle}
                      onChange={e => setPostTitle(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="postContent" className="text-slate-300">Description / Details</Label>
                    <Textarea
                      id="postContent"
                      required
                      rows={6}
                      placeholder="Enter the full description of your query or topic of discussion..."
                      className="bg-black/20 border-white/10 text-white placeholder:text-slate-700 focus-visible:ring-primary focus-visible:border-primary"
                      value={postContent}
                      onChange={e => setPostContent(e.target.value)}
                    />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button type="button" variant="outline" className="flex-1 glass text-slate-300" onClick={() => setIsPostModalOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" className="flex-1 bg-primary text-black hover:bg-primary/95" disabled={postSubmitting}>
                      {postSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Publish"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ================= MODAL: CREATE POLL ================= */}
        {isPollModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <Card className="w-full max-w-md bg-slate-900 border border-white/10 shadow-2xl relative text-white">
              <Button variant="ghost" size="icon" className="absolute right-4 top-4 text-slate-400 hover:text-white" onClick={() => setIsPollModalOpen(false)}>
                <X className="h-5 w-5" />
              </Button>
              <CardHeader>
                <CardTitle className="text-lg font-bold text-white uppercase tracking-wide">Create Community Poll</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreatePoll} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="pollQuestion" className="text-slate-300">Poll Question</Label>
                    <Input
                      id="pollQuestion"
                      required
                      placeholder="e.g. Should we renovate the community park gym?"
                      className="bg-black/20 border-white/10 text-white placeholder:text-slate-700 focus-visible:ring-primary focus-visible:border-primary"
                      value={pollQuestion}
                      onChange={e => setPollQuestion(e.target.value)}
                    />
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <Label className="text-slate-300">Voting Options</Label>
                      <Button
                        type="button" variant="ghost" size="sm" className="h-6 text-[10px] text-primary hover:text-white hover:bg-primary/10 uppercase tracking-wider"
                        onClick={handleAddPollOption}
                      >
                        Add Option
                      </Button>
                    </div>

                    <ScrollArea className="max-h-[200px] pr-2 space-y-2">
                      {pollOptions.map((opt, idx) => (
                        <div key={idx} className="flex gap-2 items-center">
                          <Input
                            placeholder={`Option ${idx + 1}`}
                            required
                            value={opt}
                            onChange={e => {
                              const nextOptions = [...pollOptions]
                              nextOptions[idx] = e.target.value
                              setPollOptions(nextOptions)
                            }}
                            className="bg-black/20 border-white/10 text-white placeholder:text-slate-700 focus-visible:ring-primary focus-visible:border-primary flex-1"
                          />
                          {pollOptions.length > 2 && (
                            <Button
                              type="button" variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-red-400 shrink-0"
                              onClick={() => handleRemovePollOption(idx)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </ScrollArea>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button type="button" variant="outline" className="flex-1 glass text-slate-300" onClick={() => setIsPollModalOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" className="flex-1 bg-primary text-black hover:bg-primary/95" disabled={pollSubmitting}>
                      {pollSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create Poll"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </ScrollArea>
  )
}

export default Community
