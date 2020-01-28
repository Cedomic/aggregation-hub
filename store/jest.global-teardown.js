const shell = require("shelljs");

module.exports = async () => {
  shell.exec("docker-compose -f docker-compose.test.yml down");
  shell.exec("rm -r elasticsearch-data-test");
  shell.exec("docker system prune -f");
};
