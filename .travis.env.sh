shopt -s expand_aliases
alias mvn="mvn -DskipTests --batch-mode -Dorg.slf4j.simpleLogger.log.org.apache.maven.cli.transfer.Slf4jMavenTransferListener=warn -Drevision='$TRAVIS_BUILD_NUMBER'"
