from hacksport.docker import DockerChallenge, HTTP


class Problem(DockerChallenge):
    def setup(self):
        self.ports = { 1823: HTTP("Description of port, ex. website", path="/optional", link_test="also optional, ex. my website") }
        self.initialize_docker({})

    def generate_flag(self, random):
        return "flag goes here"
