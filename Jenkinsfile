pipeline {
    agent any

    environment {
        IMAGE_TAG = "${env.BUILD_NUMBER}"
        HOST_PORT = '8080'
    }

    stages {
        stage('Build image') {
            steps {
                dir('web-urbanoa') {
                    sh 'docker compose build'
                }
            }
        }

        stage('Deploy') {
            steps {
                dir('web-urbanoa') {
                    sh 'docker compose up -d --remove-orphans'
                }
            }
        }

        stage('Health check') {
            steps {
                sh "curl -fsS http://localhost:${HOST_PORT}/ > /dev/null"
            }
        }
    }

    post {
        success {
            echo "Despliegue OK: http://localhost:${HOST_PORT}/"
        }
        failure {
            echo 'El pipeline falló. Revisa los logs de build o del contenedor web-urbanoa.'
        }
        always {
            sh 'docker image prune -f || true'
        }
    }
}
