// ═══════════════════════════════════════════════════════════════
// CONFIGURACIÓN
// ═══════════════════════════════════════════════════════════════

def ENVIRONMENT    = 'web-urbanoa'
def HOST           = '51.83.97.52'
def CONTAINER_NAME = 'web-urbanoa'
def PROJECT_NAME   = 'web-urbanoa'
def BUILD_DIR      = '/opt/gentelia/web-urbanoa'
def HOST_PORT      = '8080'

// ═══════════════════════════════════════════════════════════════
// SSH — credenciales con permisos Docker en el servidor
// ═══════════════════════════════════════════════════════════════

def remote = [:]
remote.name            = 'Gentalia-Server'
remote.host            = HOST
remote.allowAnyHosts   = true
remote.agentForwarding = true

node {
    withCredentials([usernamePassword(
        credentialsId: 'Gentalia-Server',
        usernameVariable: 'username',
        passwordVariable: 'password'
    )]) {
        remote.user     = username
        remote.password = password
    }
}

// ═══════════════════════════════════════════════════════════════
// PIPELINE
// ═══════════════════════════════════════════════════════════════

pipeline {
    agent any

    stages {

        stage('Details') {
            steps {
                script {
                    def imageTag = "build-${env.BUILD_NUMBER}"
                    echo """
                    ═══════════════════════════════════════════════════════════
                    Entorno:    ${ENVIRONMENT.toUpperCase()}
                    Proyecto:   ${PROJECT_NAME}
                    Imagen tag: ${imageTag}
                    Contenedor: ${CONTAINER_NAME}
                    URL:        http://${HOST}:${HOST_PORT}/
                    Build cmd:  npm run build
                    ═══════════════════════════════════════════════════════════
                    """
                }
            }
        }

        stage('Build Image') {
            steps {
                script {
                    def imageTag  = "build-${env.BUILD_NUMBER}"
                    def workspace = env.WORKSPACE
                    def sourceDir = new File("${workspace}/docker-compose.yml").exists()
                        ? workspace
                        : "${workspace}/web-urbanoa"

                    sshCommand remote: remote, command: """
                        rm -rf ${BUILD_DIR} &&
                        mkdir -p -m 775 ${BUILD_DIR} &&
                        cp -r '${sourceDir}/.' ${BUILD_DIR} &&
                        docker build \
                            -t ${PROJECT_NAME}:${imageTag} \
                            ${BUILD_DIR}
                    """
                }
            }
        }

        stage('Deploy') {
            steps {
                script {
                    def imageTag = "build-${env.BUILD_NUMBER}"

                    sshCommand remote: remote, command: "docker stop ${CONTAINER_NAME} 2>/dev/null || true"
                    sshCommand remote: remote, command: "docker rm   ${CONTAINER_NAME} 2>/dev/null || true"

                    sshCommand remote: remote, command: """
                        docker run -d \
                            --name ${CONTAINER_NAME} \
                            --restart unless-stopped \
                            -p ${HOST_PORT}:80 \
                            ${PROJECT_NAME}:${imageTag}
                    """
                }
            }
        }

        stage('Health Check') {
            steps {
                script {
                    sleep(time: 10, unit: 'SECONDS')

                    def status = sshCommand remote: remote,
                        command: "docker ps --filter name=${CONTAINER_NAME} --format '{{.Status}}'",
                        failOnError: false

                    if (status.contains('Up')) {
                        echo 'Contenedor corriendo correctamente'
                    } else {
                        def logs = sshCommand remote: remote,
                            command: "docker logs ${CONTAINER_NAME}",
                            failOnError: false
                        echo "ERROR - Logs del contenedor:\n${logs}"
                        error 'El contenedor no está corriendo correctamente'
                    }
                }
            }
        }
    }

    post {
        always {
            script {
                try {
                    def imageTag = "build-${env.BUILD_NUMBER}"
                    sshCommand remote: remote,
                        command: "docker rmi ${PROJECT_NAME}:${imageTag} 2>/dev/null || true",
                        failOnError: false
                } catch (Exception e) {
                    echo "Advertencia: No se pudieron limpiar algunas imágenes: ${e.message}"
                }
            }
        }

        success {
            echo """
            ═══════════════════════════════════════════════════════════
            DESPLIEGUE EXITOSO
            Entorno:    ${ENVIRONMENT}
            Build:      build-${env.BUILD_NUMBER}
            Contenedor: ${CONTAINER_NAME}
            URL:        http://${HOST}:${HOST_PORT}/
            ═══════════════════════════════════════════════════════════
            """
        }

        failure {
            echo """
            ═══════════════════════════════════════════════════════════
            DESPLIEGUE FALLIDO
            Entorno:    ${ENVIRONMENT}
            Build:      build-${env.BUILD_NUMBER}
            Revise los logs para más detalles
            ═══════════════════════════════════════════════════════════
            """
        }
    }
}
