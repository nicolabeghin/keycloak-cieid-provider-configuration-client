start: createfolders build
	docker run --net=host -w /usr/src/app --rm -v ${PWD}/log:/usr/src/app/log cieidclient:latest

createfolders:
	mkdir -p log || true

build:
	docker build -t cieidclient .
