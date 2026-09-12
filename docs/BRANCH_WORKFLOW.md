# Branch Workflow

## Branch naming

`feature/S2-XX-short-description`

Example:

```
feature/S2-01-artist-grid
```

## Steps

1. Sync `develop`: `git checkout develop` then `git pull`
2. Create your branch: `git checkout -b feature/S2-01-artist-grid`
3. Commit often with clear messages
4. Push and open a PR to `develop`
5. CI must pass before review

## Commit style

Use imperative mood:

- "Add artist grid"
- "Fix search filter"
