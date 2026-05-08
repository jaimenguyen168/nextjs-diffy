export interface GitHubRepo {
  githubId: number;
  name: string;
  fullName: string;
  private: boolean;
  htmlUrl: string;
  description: string | null;
  language: string | null;
  stars: number;
  updatedAt: string;
}

export interface ConnectedRepo {
  id: string;
  fullName: string;
  private: boolean;
  createdAt: Date;
  openPRCount: number;
}
