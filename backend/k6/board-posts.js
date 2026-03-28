import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  scenarios: {
    read_posts: {
      executor: 'ramping-vus',
      startVUs: 1,
      stages: [
        { duration: '30s', target: 10 },
        { duration: '30s', target: 50 },
        { duration: '30s', target: 100 },
        { duration: '30s', target: 0 },
      ],
      gracefulRampDown: '10s',
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<1000'],
  },
};

export default function () {
  const page = Math.floor(Math.random() * 100) + 1;
  const limit = 20;
  const response = http.get(
    `http://localhost:3000/board/posts?page=${page}&limit=${limit}`,
  );

  check(response, {
    'status is 200': (res) => res.status === 200,
  });

  sleep(1);
}
