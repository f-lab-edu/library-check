import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BoardPostItemDto } from './dto/board-post-response.dto';
import { BoardPost } from './entities/board-post.entity';

@Injectable()
export class BoardRepository {
  constructor(
    @InjectRepository(BoardPost)
    private readonly postRepository: Repository<BoardPost>,
  ) {}

  async findPostSummaries(
    limit: number,
    offset: number,
  ): Promise<BoardPostItemDto[]> {
    const postIds = await this.findPostIds(limit, offset);

    if (postIds.length === 0) {
      return [];
    }

    const rows = await this.postRepository
      .createQueryBuilder('post')
      .innerJoin('post.user', 'user')
      .leftJoin('post.comments', 'comment')
      .where('post.id IN (:...postIds)', { postIds })
      .select('post.id', 'id')
      .addSelect('post.title', 'title')
      .addSelect('post.content', 'content')
      .addSelect('post.createdAt', 'createdAt')
      .addSelect('user.id', 'userId')
      .addSelect('user.nickname', 'userNickname')
      .addSelect('COUNT(comment.id)', 'commentCount')
      .groupBy('post.id')
      .addGroupBy('post.title')
      .addGroupBy('post.content')
      .addGroupBy('post.createdAt')
      .addGroupBy('user.id')
      .addGroupBy('user.nickname')
      .orderBy('post.id', 'DESC')
      .getRawMany();

    return rows.map((row) => ({
      id: Number(row.id),
      title: row.title,
      content: row.content,
      createdAt: row.createdAt,
      userId: Number(row.userId),
      userNickname: row.userNickname,
      commentCount: Number(row.commentCount),
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
      .getRawMany();

    return rows.map((row) => Number(row.id));
  }
}
