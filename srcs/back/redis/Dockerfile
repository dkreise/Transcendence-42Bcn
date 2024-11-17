FROM	debian:bullseye

RUN 	apt update && apt install build-essential python3-dev python3-pip python3-venv redis-server -y
RUN		apt-get -y upgrade
RUN 	pip3 install --upgrade pip setuptools wheel
RUN 	pip3 install -U setuptools
RUN 	pip3 install channels-redis~=4.2 redis~=5.0
CMD		redis-server --protected-mode no