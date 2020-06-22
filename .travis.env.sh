shopt -s expand_aliases
alias mvn="mvn -P!standard-with-extra-repos --batch-mode -Drevision='$(date +%Y.%m%d.%H%M%S)-$(git rev-parse HEAD)'"
