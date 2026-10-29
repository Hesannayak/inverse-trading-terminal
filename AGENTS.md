<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Architecture rules
- All app data comes from the typed service layer in `src/services/` (`getMarkets`, `previewOpen`, `openPosition`, …). Components and TanStack Query call only `src/services` — never blockchain SDKs, wallet libraries, or websockets. Mock implementations live in `src/services/mock.ts` and are swapped for live ones later; the types in `src/services/types.ts` are the contract.
