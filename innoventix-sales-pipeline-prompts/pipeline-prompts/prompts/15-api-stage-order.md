# 15 - Stage reorder and column move endpoints

Confirm and finish the column-reordering path used by the drag-to-reorder columns feature.

1. Make sure PUT /api/pipelines/[pipelineId]/stages/order is transactional: it validates that orderedIds contains exactly the pipeline's current stage IDs (no missing, no extra, no duplicates), then rewrites positions to 1000, 2000, 3000, and so on.
2. Add a broadcast or revalidation hint in the response: return the new ordered list so the client can reconcile.
3. Reject reorders from members. Only admin and owner may reorder stages.
4. Add tests for: missing ID, extra ID, duplicate ID, another org's stage ID, and a successful reorder.
