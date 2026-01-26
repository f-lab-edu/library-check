import { Test, TestingModule } from '@nestjs/testing';
import { OsvBatchService } from './osv-batch.service';
import { HttpService } from '@nestjs/axios';
import { AxiosResponse } from '@nestjs/terminus/dist/health-indicator/http/axios.interfaces';
import { of, throwError } from 'rxjs';
import { osv } from '../config/app.config';

describe('OsvBatchService', () => {
  let service: OsvBatchService;
  let httpService: HttpService;

  const mockPackages = [
    { name: 'lodash', version: '4.17.20', ecosystem: 'npm' },
    { name: 'express', version: '4.18.0', ecosystem: 'npm' },
  ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OsvBatchService,
        {
          provide: HttpService,
          useValue: {
            post: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<OsvBatchService>(OsvBatchService);
    httpService = module.get<HttpService>(HttpService);
  });

  describe('bulidBatchQuery', () => {
    it('should convert package array to OSV batch query format', () => {
      const result = service.buildBatchQuery(mockPackages);

      expect(result).toEqual({
        queries: [
          {
            package: { name: 'lodash', ecosystem: 'npm' },
            version: '4.17.20',
          },
          {
            package: { name: 'express', ecosystem: 'npm' },
            version: '4.18.0',
          },
        ],
      });
    });

    it('should return empty queries when given empty array', () => {
      const result = service.buildBatchQuery([]);

      expect(result).toEqual({ queries: [] });
    });
  });

  describe('executeBatchQuery', () => {
    it('should successfully send batch query to OSV API', async () => {
      const mockResponse: AxiosResponse = {
        data: {
          result: [{ vulns: [] }, { vulns: [{ id: 'GHSA-xxx' }] }],
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };

      jest.spyOn(httpService, 'post').mockReturnValue(of(mockResponse));

      const query = service.buildBatchQuery(mockPackages);
      const result = await service.executeBatchQuery(query);

      const expectedUrl = `${osv.apiUrl}${osv.batchEndpoint}`;

      expect(httpService.post).toHaveBeenCalledWith(
        expectedUrl,
        query,
        expect.objectContaining({
          headers: { 'Content-Type': 'application/json' },
          timeout: osv.timeout,
        }),
      );
      expect(result).toEqual(mockResponse.data);
    });

    it('should throw error when API request fails', async () => {
      jest
        .spyOn(httpService, 'post')
        .mockReturnValue(throwError(() => new Error('Network error')));

      const query = service.buildBatchQuery(mockPackages);
      await expect(service.executeBatchQuery(query)).rejects.toThrow(
        'Network error',
      );
    });
  });
});
