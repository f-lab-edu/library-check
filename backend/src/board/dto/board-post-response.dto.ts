export class BoardPostItemDto {
  id: number;

  title: string;

  content: string;

  createdAt: Date;

  userId: number;

  userNickname: string | null;

  commentCount: number;
}

export class BoardPostListResponseDto {
  page: number;

  limit: number;

  total: number;

  items: BoardPostItemDto[];
}
