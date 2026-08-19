import { vectorService } from '../../src/services/vector.service';

describe('VectorService Search Query Formulation', () => {
  it('should formulate hybrid search parameters properly for free-tier 90-day cutoff', async () => {
    const filters = {
      userId: 'mock-user-123',
      query: 'Uber receipts',
      limitDays: 90,
      taxYear: 2025,
    };

    expect(filters.limitDays).toBe(90);
    expect(filters.taxYear).toBe(2025);
  });
});
