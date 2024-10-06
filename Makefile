
#-f flag -> specify the name and path of one or more compose files

#-d detach -> run containers in the background

D_PS = $(docker ps -aq)
D_IMG = $(docker images -q)

all: up

#up -> pulls base image, builds image, starts services
up:
	docker-compose -f ./srcs/docker-compose.yml up -d --build

#stop -> stops services
stop:
	docker-compose -f ./srcs/docker-compose.yml stop

#down -> stops and removes containers and networks
down:
	docker-compose -f ./srcs/docker-compose.yml down

#rm -> removes stopped service containers
clean:
	docker-compose -f ./srcs/docker-compose.yml rm

ps:
	docker-compose -f ./srcs/docker-compose.yml ps

logs:
	docker logs ${CONTAINER}

fclean: down clean
	docker stop ${D_PS} || true
	docker rm ${D_PS} || true
	docker rmi ${D_IMG} || true
	docker system prune -af --volumes || true
	#docker volume rm srcs_wordpress || true
	#docker volume rm srcs_mariadb || true

re: fclean all

.SILENT: all build up stop down ps clean fclean
