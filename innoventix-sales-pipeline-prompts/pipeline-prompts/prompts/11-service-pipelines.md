# 11 - Service layer: pipelines, stages, labels, checklists, comments

Add the remaining service functions to the same service layer style.

- Pipelines: create, rename, set default, delete (with rules from prompt 06).
- Stages: create, rename, recolor, set won or lost flags, set WIP limit, reorder (takes the full ordered list of stage IDs, then rewrites positions in one transaction), delete with a required target stage for deals.
- Labels: create, rename, recolor, delete (removes links, not deals). Labels belong to one pipeline.
- Checklists: add, rename, delete. Items: add, edit text, toggle done, reorder, delete.
- Comments: add, edit (author only), soft delete (author or admin).

Every mutation records activity where it applies. Every function checks permissions and org scope. Add tests for reorder atomicity and comment permissions.
