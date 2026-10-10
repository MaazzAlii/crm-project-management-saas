# 19 - Board and column layout (static, no drag yet)

Create:
- `components/pipeline/Board.tsx`: horizontal scroll container, columns in a row, gap 12px, columns fixed width 280px, board height fills the viewport below the header.
- `components/pipeline/Column.tsx`: header with stage name, color dot, count, total value (formatted), and a "..." menu button (menu built later). Body is a vertical scroll list of cards. Footer has "+ Add a card" (click handler added in prompt 22).
- Won and lost columns are visually distinct: a green or red top border, and they can be collapsed to a narrow strip (toggle in the header).

Feed the board from the data loader in prompt 20. For now use the sample data from the dev page.

The column body must scroll independently. Empty columns show a dashed placeholder "Drop deals here".
