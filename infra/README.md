# Infrastructure

Kubernetes manifests, managed with Kustomize.

```
k8s/
├── base/                 Postgres, API, web, Studio and Ingress
└── overlays/
    ├── local/            Local images, development credentials, *.localhost hosts
    └── production/       Registry images, real domains, TLS through cert-manager
```

Preview what an overlay renders:

```bash
kubectl kustomize infra/k8s/overlays/production
```

## Cluster requirements

- An NGINX Ingress controller (`ingressClassName: nginx`).
- A default StorageClass, for the 5 GiB Postgres volume.
- Production only: cert-manager with a ClusterIssuer named `letsencrypt`.

## Local cluster

Build the images (`docker compose build`) and make them available to your cluster, then:

```bash
kubectl apply -k infra/k8s/overlays/local
```

## Production

1. Build and push the three images, then set their registry and tag in `overlays/production/kustomization.yaml`.
   Build the Studio image with `--build-arg SANITY_STUDIO_PROJECT_ID=<your project>`, because the ID is compiled in.
2. Create the namespace and the Secret. It is never committed:

   ```bash
   kubectl create namespace real-state
   kubectl -n real-state create secret generic real-state-secrets \
     --from-literal=POSTGRES_USER=realstate \
     --from-literal=POSTGRES_PASSWORD="$PASSWORD" \
     --from-literal=POSTGRES_DB=realstate \
     --from-literal=DATABASE_URL="postgres://realstate:$PASSWORD@postgres:5432/realstate" \
     --from-literal=SANITY_API_WRITE_TOKEN="$SANITY_EDITOR_TOKEN"
   ```

3. Apply: `kubectl apply -k infra/k8s/overlays/production`

## Before going live

- **Backups:** Postgres holds customer contact details and nothing backs it up yet. Add scheduled `pg_dump`s or use a managed database.
- **Scaling the API:** migrations run in the API pod's init container, so stay on one replica until they move to a Job.
