---
description: List all stored instincts with confidence scores and domains
---

# Instinct Status

List all learned instincts from `.opencode/learned/`.

## Output format

```
Domain: workflow (3 instincts)
  prisma-generate-after-schema-change    0.8  ✅ active
  set-env-before-ingestion               0.7  ✅ active
  docker-rebuild-after-env-change        0.5  ⚠️ tentative

Domain: testing (1 instinct)
  ts-node-not-jest                       0.9  ✅ active
```
