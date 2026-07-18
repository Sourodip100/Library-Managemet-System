# 📚 Library Management System — MERN on AWS EKS

A full-stack Library Management System built with **MongoDB, Express, React, Node.js**, containerized with **Docker**, and deployed to **Kubernetes on AWS EKS**. Built as a learning project to go deep on Kubernetes and AWS.

## Features

- JWT authentication with roles: `member`, `librarian`, `admin`
- Book catalog with search, category filter, pagination
- Borrow / return workflow with due dates and automatic overdue fines
- Admin dashboard: manage books (CRUD), view all transactions
- Kubernetes-ready: liveness/readiness probes, graceful shutdown, HPA, PDB, NetworkPolicy
- CI/CD pipeline (GitHub Actions) that builds images, pushes to ECR, and rolls out to EKS

## Tech Stack

| Layer      | Technology                                   |
|------------|-----------------------------------------------|
| Frontend   | React 18, React Router, Axios, Nginx (serving)|
| Backend    | Node.js 18, Express, Mongoose, JWT            |
| Database   | MongoDB Atlas (managed, M0 free tier)          |
| Container  | Docker (multi-stage builds)                   |
| Orchestration | Kubernetes (AWS EKS)                       |
| Ingress    | AWS Load Balancer Controller (ALB)            |
| CI/CD      | GitHub Actions + Amazon ECR                   |

## Project Structure

```
library-management-system/
├── backend/                 # Express API
│   ├── src/
│   │   ├── config/db.js
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── utils/
│   │   └── server.js
│   ├── Dockerfile
│   ├── .env.example
│   └── package.json
├── frontend/                # React SPA
│   ├── src/
│   ├── public/
│   ├── Dockerfile
│   ├── nginx.conf
│   ├── .env.example
│   └── package.json
├── k8s/                      # Kubernetes manifests
│   ├── 00-namespace.yaml
│   ├── 01-secrets.template.yaml
│   ├── 02-configmap.yaml
│   ├── 04-backend-deployment.yaml
│   ├── 05-frontend-deployment.yaml
│   ├── 06-ingress.yaml
│   ├── 07-hpa.yaml
│   ├── 08-pdb.yaml
│   ├── 09-networkpolicy.yaml
│   └── kustomization.yaml
├── .github/workflows/deploy.yml
├── docker-compose.yml
└── .gitignore
```

---

## Part 1 — Run Locally with Docker Compose

Fastest way to see the whole stack running.

```bash
git clone <your-repo-url>
cd library-management-system
docker compose up --build
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:5000/api
- Seed an admin user + sample books:

```bash
docker compose exec backend npm run seed
```

Default admin login after seeding: `admin@library.com` / `Admin@123`

> Note: `docker-compose.yml` runs MongoDB in a local container purely for development convenience. The EKS deployment in Part 3 uses **MongoDB Atlas** instead — you can also point your local `.env` at Atlas if you'd rather not run Mongo locally at all.

## Part 2 — Run Locally without Docker (plain npm)

```bash
# Backend
cd backend
cp .env.example .env        # edit MONGO_URI to point at your local Mongo
npm install
npm run dev                 # nodemon on port 5000

# Frontend (new terminal)
cd frontend
cp .env.example .env
npm install
npm start                   # CRA dev server on port 3000
```

---

## Part 3 — Deploy to AWS EKS (step by step)

This is the core learning exercise. Below is the full path from an empty AWS account to a running, autoscaling app behind a public load balancer.

### Prerequisites

Install locally:
- `aws` CLI v2, configured (`aws configure`)
- `kubectl`
- `eksctl`
- `helm`
- `docker`

### Step 1 — Set up a free MongoDB Atlas cluster

This project uses **MongoDB Atlas** (managed) instead of running MongoDB inside the cluster — one less thing to operate, and it's free at this scale.

1. Sign up at https://www.mongodb.com/cloud/atlas/register and create a free **M0** cluster.
2. **Database Access** → add a database user (e.g. `libraryapp`) with a strong password — save it, you'll need it below.
3. **Network Access** → add an IP entry. For learning purposes the simplest option is `0.0.0.0/0` (allow from anywhere), since EKS node IPs aren't static. For production, use **VPC Peering** or **AWS PrivateLink** between Atlas and your VPC instead.
4. **Database** → Connect → Drivers → copy the connection string. It looks like:
   ```
   mongodb+srv://libraryapp:<password>@cluster0.xxxxx.mongodb.net/library_db?retryWrites=true&w=majority
   ```
   Keep this handy for Step 6.

### Step 2 — Check which instance types your account/region supports, then create the EKS cluster

Some accounts/regions restrict certain instance types (e.g. `t3.medium` unavailable, or a vCPU service quota too low). Check what's actually offered before creating the cluster:

```bash
aws ec2 describe-instance-type-offerings \
  --location-type availability-zone \
  --filters Name=instance-type,Values=t3.medium,t3.small,t3a.medium,t3a.small,m5.large \
  --region us-east-1 \
  --output table
```

Pick whichever type shows up as available. `t3.small` (2 vCPU, 2 GiB) is a safe, cheap default if `t3.medium` isn't offered — it's enough for this app since MongoDB now lives outside the cluster.

```bash
eksctl create cluster \
  --name library-eks-cluster \
  --region us-east-1 \
  --nodegroup-name standard-workers \
  --node-type t3.small \
  --nodes 2 \
  --nodes-min 2 \
  --nodes-max 4 \
  --managed
```

This provisions the control plane, a managed node group, and VPC networking. Takes ~15-20 minutes. `eksctl` also configures your local `kubectl` context automatically.

Verify:
```bash
kubectl get nodes
```

> Note: because MongoDB is now external (Atlas), you no longer need the EBS CSI driver add-on or a StorageClass for this app — nothing in the cluster requests persistent storage anymore.

### Step 3 — Create ECR repositories and push images

```bash
export AWS_REGION=us-east-1
export ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

aws ecr create-repository --repository-name library-backend --region $AWS_REGION
aws ecr create-repository --repository-name library-frontend --region $AWS_REGION

aws ecr get-login-password --region $AWS_REGION | \
  docker login --username AWS --password-stdin $ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com

# Backend
cd backend
docker build -t $ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/library-backend:latest .
docker push $ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/library-backend:latest
cd ..

# Frontend (bake in the API URL you'll expose via the ALB, e.g. api path on same host)
cd frontend
docker build \
  --build-arg REACT_APP_API_URL=/api \
  -t $ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/library-frontend:latest .
docker push $ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/library-frontend:latest
cd ..
```

> Note: `REACT_APP_API_URL=/api` works because the Ingress in this project routes `/api` on the same ALB host to the backend service — no separate domain/CORS setup needed.

Now update the image references in `k8s/04-backend-deployment.yaml` and `k8s/05-frontend-deployment.yaml` to the ECR URIs above (replace `<YOUR_ECR_REPO>`).

### Step 4 — Install the AWS Load Balancer Controller

The controller lets Kubernetes `Ingress` objects provision real AWS Application Load Balancers.

```bash
eksctl utils associate-iam-oidc-provider --cluster library-eks-cluster --approve

curl -O https://raw.githubusercontent.com/kubernetes-sigs/aws-load-balancer-controller/main/docs/install/iam_policy.json
aws iam create-policy \
  --policy-name AWSLoadBalancerControllerIAMPolicy \
  --policy-document file://iam_policy.json

eksctl create iamserviceaccount \
  --cluster=library-eks-cluster \
  --namespace=kube-system \
  --name=aws-load-balancer-controller \
  --role-name AmazonEKSLoadBalancerControllerRole \
  --attach-policy-arn=arn:aws:iam::$ACCOUNT_ID:policy/AWSLoadBalancerControllerIAMPolicy \
  --approve

helm repo add eks https://aws.github.io/eks-charts
helm repo update
helm install aws-load-balancer-controller eks/aws-load-balancer-controller \
  -n kube-system \
  --set clusterName=library-eks-cluster \
  --set serviceAccount.create=false \
  --set serviceAccount.name=aws-load-balancer-controller
```

### Step 5 — Enable metrics-server (for HPA)

```bash
aws eks create-addon --cluster-name library-eks-cluster --addon-name metrics-server --region $AWS_REGION
```

### Step 6 — Create real Kubernetes Secrets

**Never commit real secrets.** Generate them directly against the cluster, using the Atlas connection string from Step 1:

```bash
kubectl create namespace library-system

kubectl create secret generic mongo-secret \
  --namespace=library-system \
  --from-literal=MONGO_URI='mongodb+srv://libraryapp:<password>@cluster0.xxxxx.mongodb.net/library_db?retryWrites=true&w=majority'

kubectl create secret generic backend-secret \
  --namespace=library-system \
  --from-literal=JWT_SECRET="$(openssl rand -base64 48)"
```

Replace `<password>` and the cluster hostname with your actual Atlas values. If your password contains special characters, URL-encode them or the connection string will fail to parse.

### Step 7 — Deploy everything else with Kustomize

```bash
kubectl apply -k k8s/
```

Watch the rollout:
```bash
kubectl get pods -n library-system -w
```

### Step 8 — Get the Load Balancer URL

```bash
kubectl get ingress library-ingress -n library-system
```

Wait a couple of minutes for the `ADDRESS` column to populate with the ALB's DNS name, then open it in a browser. That's your live app.

### Step 9 — Seed initial data

```bash
kubectl exec -n library-system deploy/backend -- npm run seed
```

---

## Part 4 — Operating & Learning Exercises

Once it's running, these are the exercises worth doing to really internalize Kubernetes/EKS:

- **Scale manually:** `kubectl scale deployment backend --replicas=4 -n library-system`
- **Watch the HPA kick in:** generate load (`hey` or `ab`) against the backend and watch `kubectl get hpa -n library-system -w`
- **Simulate a pod crash:** `kubectl delete pod <backend-pod> -n library-system` and watch the Deployment self-heal
- **Rolling update:** push a new image tag, `kubectl set image deployment/backend backend=<new-image> -n library-system`, and watch `kubectl rollout status`
- **Rollback:** `kubectl rollout undo deployment/backend -n library-system`
- **Inspect logs:** `kubectl logs -f deploy/backend -n library-system`
- **Exec into a pod:** `kubectl exec -it deploy/backend -n library-system -- sh`
- **Drain a node** and observe the PodDisruptionBudget keep the app available: `kubectl drain <node> --ignore-daemonsets`

## Part 5 — Tear Down (avoid ongoing AWS charges)

```bash
kubectl delete -k k8s/
eksctl delete cluster --name library-eks-cluster --region us-east-1
```

Also delete the ECR repositories if you don't need the images anymore. Separately, pause or delete your Atlas cluster (Atlas → cluster → ... → Terminate) if you're done — the M0 free tier doesn't bill, but it's good practice to clean up the network access entry (`0.0.0.0/0`) once you're finished, or tighten it if you plan to keep the cluster around.

---

## API Reference (quick summary)

| Method | Endpoint                          | Access          | Description               |
|--------|-------------------------------------|-----------------|----------------------------|
| POST   | /api/auth/register                | Public          | Register a member account |
| POST   | /api/auth/login                   | Public          | Login, returns JWT         |
| GET    | /api/auth/me                      | Private         | Current user profile       |
| GET    | /api/books                        | Public          | List/search books           |
| GET    | /api/books/:id                    | Public          | Book detail                |
| POST   | /api/books                        | Admin/Librarian | Create book                 |
| PUT    | /api/books/:id                    | Admin/Librarian | Update book                 |
| DELETE | /api/books/:id                    | Admin           | Delete book                 |
| POST   | /api/transactions/issue           | Private         | Borrow a book               |
| PUT    | /api/transactions/:id/return      | Private         | Return a book                |
| GET    | /api/transactions/my              | Private         | My loan history               |
| GET    | /api/transactions                 | Admin/Librarian | All transactions              |
| GET    | /healthz                          | Public          | Liveness probe                |
| GET    | /readyz                           | Public          | Readiness probe (checks DB)   |

## License

MIT — use this freely for learning.
