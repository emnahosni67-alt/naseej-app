// Pipeline Jenkins du projet Naseej
// Declenche automatiquement par GitHub (verification du depot toutes les 2 minutes),
// il recupere le code et construit une image Docker par microservice.
pipeline {
    agent any

    options {
        timestamps()                        // horodatage de chaque ligne du journal
        buildDiscarder(logRotator(numToKeepStr: '10'))
    }

    triggers {
        pollSCM('H/2 * * * *')              // interroge GitHub toutes les 2 minutes
    }

    environment {
        TAG = "${env.BUILD_NUMBER}"         // chaque image est etiquetee avec le numero du build
    }

    stages {
        stage('Checkout GitHub') {
            steps {
                checkout scm                // clone la branche main du depot GitHub
                sh 'git log -1 --pretty=format:"Commit %h par %an : %s"'
            }
        }
        stage('Build auth-service') {
            steps {
                sh 'docker build -t naseej-auth:${TAG} backend/auth-service'
            }
        }
        stage('Build emergency-service') {
            steps {
                sh 'docker build -t naseej-emergency:${TAG} backend/emergency-service'
            }
        }
        stage('Build api-gateway') {
            steps {
                sh 'docker build -t naseej-gateway:${TAG} backend/api-gateway'
            }
        }
        stage('Build frontend') {
            steps {
                sh 'docker build -t naseej-frontend:${TAG} frontend'
            }
        }
        stage('Verification des images') {
            steps {
                sh 'docker images --format "{{.Repository}}:{{.Tag}}  {{.Size}}" | grep -E "^naseej-[a-z]+:${TAG} "'
            }
        }
    }

    post {
        success { echo "Build ${TAG} reussi : 4 images Docker construites depuis GitHub." }
        failure { echo "Build ${TAG} en echec : consulter le journal de l'etape en rouge." }
    }
}
