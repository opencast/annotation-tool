shopt -s expand_aliases
alias mvn="mvn -P!standard-with-extra-repos -Dintegration=backend -Dmaven.test.skip --batch-mode -Drevision='$TRAVIS_BUILD_NUMBER'"
