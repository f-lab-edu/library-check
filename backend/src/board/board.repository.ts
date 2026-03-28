import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BoardPostItemDto } from './dto/board-post-response.dto';
import { BoardPost } from './entities/board-post.entity';
import { BoardComment } from './entities/board-comment.entity';

type BoardPostSummaryRow = {
  id: number;
  title: string;
  content: string;
  createdAt: Date;
  userId: number;
  userNickname: string;
};

type CommentCountRow = {
  postId: string;
  commentCount: string;
};

@Injectable()
export class BoardRepository {
  constructor(
    @InjectRepository(BoardPost)
    private readonly postRepository: Repository<BoardPost>,

    @InjectRepository(BoardComment)
    private readonly commentRepository: Repository<BoardComment>,
  ) {}

  async findPostSummaries(
    limit: number,
    offset: number,
  ): Promise<BoardPostItemDto[]> {
    const postIds = await this.findPostIds(limit, offset);

    if (postIds.length === 0) {
      return [];
    }

    const [posts, commentCountMap] = await Promise.all([
      this.findPostsWithUser(postIds),
      this.findCommentCountMap(postIds),
    ]);

    return posts.map((post) => ({
      id: post.id,
      title: post.title,
      content: post.content,
      createdAt: post.createdAt,
      userId: post.userId,
      userNickname: post.userNickname,
      commentCount: commentCountMap.get(post.id) ?? 0,
    }));
  }

  async countPosts(): Promise<number> {
    return this.postRepository.count();
  }

  private async findPostIds(limit: number, offset: number): Promise<number[]> {
    const rows = await this.postRepository
      .createQueryBuilder('post')
      .select('post.id', 'id')
      .orderBy('post.id', 'DESC')
      .offset(offset)
      .limit(limit)
      .getRawMany<{ id: string }>();

    return rows.map((row) => Number(row.id));
  }

  private async findPostsWithUser(
    postIds: number[],
  ): Promise<BoardPostSummaryRow[]> {
    const rows = await this.postRepository
      .createQueryBuilder('post')
      .innerJoin('post.user', 'user')
      .where('post.id IN (:...postIds)', { postIds })
      .select('post.id', 'id')
      .addSelect('post.title', 'title')
      .addSelect('post.content', 'content')
      .addSelect('post.createdAt', 'createdAt')
      .addSelect('user.id', 'userId')
      .addSelect('user.nickname', 'userNickname')
      .orderBy('post.id', 'DESC')
      .getRawMany<{
        id: string;
        title: string;
        content: string;
        createdAt: Date;
        userId: string;
        userNickname: string;
      }>();

    return rows.map((row) => ({
      id: Number(row.id),
      title: row.title,
      content: row.content,
      createdAt: row.createdAt,
      userId: Number(row.userId),
      userNickname: row.userNickname,
    }));
  }

  private async findCommentCountMap(
    postIds: number[],
  ): Promise<Map<number, number>> {
    const rows = await this.commentRepository
      .createQueryBuilder('comment')
      .select('comment.postId', 'postId')
      .addSelect('COUNT(comment.id)', 'commentCount')
      .where('comment.postId IN (:...postIds)', { postIds })
      .groupBy('comment.postId')
      .getRawMany<CommentCountRow>();

    return new Map(
      rows.map((row) => [Number(row.postId), Number(row.commentCount)]),
    );
  }
}
