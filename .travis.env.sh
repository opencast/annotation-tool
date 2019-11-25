shopt -s expand_aliases
alias mvn="mvn --batch-mode -Drevision='$(date +%Y.%m%d.%H%M%S)-$(git rev-parse HEAD)'"
