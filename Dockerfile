FROM node:8

ADD . /app
WORKDIR /app
RUN npm install
#RUN apt-get update
RUN useradd -d /home/term -m -s /bin/bash term
RUN echo 'term:term' | chpasswd
RUN npm install -g express-generator
RUN express --view=ejs /home/term/tutorial2

EXPOSE 3000

ENTRYPOINT ["node"]
CMD ["app.js", "-p", "3000", "-d", "/home/term/tutorial2"]
