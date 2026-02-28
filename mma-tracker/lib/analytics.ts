// No-op analytics (localStorage only, no Supabase)

class Analytics {
  private currentPage = "home";

  setUser(_userId: string | null) {}
  setPage(page: string) { this.currentPage = page; }

  pageView(_pageName: string) {}
  sessionLogged(_type: string, _level: string, _points: number) {}
  sessionDeleted(_type: string) {}
  avatarLevelUp(_level: string, _points: number) {}
  messagesSent(_count = 1) {}
  usernameSet(_username: string) {}
}

export const analytics = new Analytics();
