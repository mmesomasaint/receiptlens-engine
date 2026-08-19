# Repository Directory Structure

# Dirmap

```Plaintext
receiptlens-engine/
├── .env.example
├── .gitignore
├── Dockerfile
├── README.md
├── docker-compose.yml
├── jest.config.ts
├── package.json
├── tsconfig.json
├── prisma/
│   ├── migrations/
│   ├── schema.prisma
│   └── seed.ts
├── extractor-service/            # Python FastAPI Microservice for OCR & Embedding
│   ├── Dockerfile
│   ├── main.py
│   ├── requirements.txt
│   └── test_extractor.py
├── src/
│   ├── @types/
│   │   └── express.d.ts
│   ├── app.ts
│   ├── config/
│   │   └── index.ts
│   ├── constants/
│   │   └── mime-types.ts
│   ├── controllers/
│   │   ├── auth.controller.ts
│   │   ├── document.controller.ts
│   │   ├── export.controller.ts
│   │   ├── subscription.controller.ts
│   │   └── webhook.controller.ts
│   ├── errors/
│   │   ├── app-error.ts
│   │   └── error-handler.ts
│   ├── middlewares/
│   │   ├── auth.middleware.ts
│   │   ├── rate-limiter.middleware.ts
│   │   └── validate.middleware.ts
│   ├── queues/
│   │   ├── ingestion.queue.ts
│   │   └── worker.ts
│   ├── routes/
│   │   ├── auth.routes.ts
│   │   ├── document.routes.ts
│   │   ├── export.routes.ts
│   │   ├── index.ts
│   │   ├── subscription.routes.ts
│   │   └── webhook.routes.ts
│   ├── schemas/
│   │   ├── document.schema.ts
│   │   └── export.schema.ts
│   ├── server.ts
│   ├── services/
│   │   ├── archive.service.ts
│   │   ├── encryption.service.ts
│   │   ├── google.service.ts
│   │   ├── ocr-client.service.ts
│   │   ├── storage.service.ts
│   │   ├── stripe.service.ts
│   │   └── vector.service.ts
│   └── utils/
│       └── logger.ts
└── tests/
    ├── integration/
    │   ├── auth.test.ts
    │   ├── document.test.ts
    │   └── export.test.ts
    ├── setup.ts
    └── unit/
        ├── encryption.test.ts
        └── vector.test.ts
```
