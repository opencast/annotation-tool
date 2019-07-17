shopt -s expand_aliases
alias mvn="mvn -Dintegration=backend -Dmaven.test.skip --batch-mode -Drevision='$TRAVIS_BUILD_NUMBER'"
