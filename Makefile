
#-f flag -> specify the name and path of one or more compose files

#-d detach -> run containers in the background
SHELL := /bin/bash

D_PS = $(shell docker ps -aq)
D_IMG = $(shell docker images -q)
OF = game
#D_VOL = $(shell docker volume ls -q --filter dangling=true)

all: up

#up -> pulls base image, builds image, starts services
up:
	docker-compose -f ./srcs/docker-compose.yml up -d --build --remove-orphans

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
	docker logs ${OF}

fclean:
	@if [ -n "$(D_PS)" ]; then \
		echo "deleting containers"; \
		docker stop $(D_PS); \
		docker rm $(D_PS); \
	fi
	@if [ -n "$(D_IMG)" ]; then \
		echo "deleting images"; \
		docker rmi $(D_IMG); \
	fi
	@if [ -n "$$(docker volume ls -q --filter dangling=true)" ]; then \
		echo "deleting volumes"; \
		docker volume rm $$(docker volume ls -q --filter dangling=true); \
		echo "volumes deleted"; \
	fi
	@if [ -d ./srcs/postgres ]; then \
		rm -rf ./srcs/postgres/*; \
	fi


re: fclean all

.SILENT: all build up stop down ps clean fclean