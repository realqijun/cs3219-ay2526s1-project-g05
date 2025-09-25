# 1. Pre-requisites

- `node 22.19.0 (LTS)`
- `pnpm 10`
  - We are using `pnpm` for package management in order for each microservice to have its own project environment yet still manage it as a whole
  - See install [here](https://pnpm.io/installation)

# 2. Installation

## 2.1 Install packages in all services

```
pnpm -r install
```

- Voila! You can now run individual services by going into their directories, OR, you can use the following to start **all services**

## 2.2

```
pnpm run dev
```

- This triggers the `dev` script in all `services`
