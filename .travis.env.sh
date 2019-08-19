shopt -s expand_aliases
alias mvn="mvn -DskipTests --batch-mode -Dorg.slf4j.simpleLogger.log.org.apache.maven.cli.transfer.Slf4jMavenTransferListener=warn -Drevision='$(date +%Y.%m%d.%H%M%S)-$(git rev-parse HEAD)'"
