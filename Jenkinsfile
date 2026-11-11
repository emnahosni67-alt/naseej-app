// Pipeline CI/CD Naseej : GitHub -> Jenkins -> Docker -> Kubernetes (Minikube)
pipeline {
  agent any

  options {
    timeout(time: 30, unit: 'MINUTES')
    timestamps()
  }

  environment {
    NS   = 'naseej'
    PATH = "/snap/bin:/usr/local/bin:/usr/bin:/bin"
  }

  stages {

    stage('Recuperation du code (GitHub)') {
      steps {
        checkout scm
        sh 'git log -1 --oneline'
      }
    }

    stage('Validation des manifestes K8s') {
      steps {
        sh 'kubectl apply --dry-run=client -f naseej-k8s.yaml'
      }
    }

    stage('Build des images Docker') {
      steps {
        sh '''
          docker build -t naseej-auth:1.0      backend/auth-service
          docker build -t naseej-emergency:1.0 backend/emergency-service
          docker build -t naseej-gateway:1.0   backend/api-gateway
          docker build -t naseej-frontend:1.0  frontend
        '''
      }
    }

    stage('Chargement des images dans Minikube') {
      steps {
        // Pas de registre : les images sont chargees directement dans le cluster
        sh 'minikube image load naseej-auth:1.0 naseej-emergency:1.0 naseej-gateway:1.0 naseej-frontend:1.0'
      }
    }

    stage('Deploiement sur Kubernetes') {
      steps {
        sh '''
          kubectl apply -f naseej-k8s.yaml
          kubectl rollout restart deployment -n $NS
        '''
      }
    }

    stage('Verification du deploiement') {
      steps {
        sh '''
          for d in auth-service emergency-service api-gateway web-frontend; do
            kubectl rollout status deployment/$d -n $NS --timeout=240s
          done
          kubectl get pods -n $NS
        '''
      }
    }
  }

  post {
    success { echo 'Pipeline termine avec succes : application deployee.' }
    failure { echo 'Pipeline en echec : voir les logs de l etape en rouge.' }
  }
}
