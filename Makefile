docker-publish:
	@docker build -t playlistduong/stackify-rest:v1 .
	@docker push playlistduong/stackify-rest:v1