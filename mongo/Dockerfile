# Single-node MongoDB replica set for Railway (Prisma requires a replica set)
FROM mongo:7.0
COPY start-mongo.sh /usr/local/bin/start-mongo.sh
RUN chmod +x /usr/local/bin/start-mongo.sh
EXPOSE 27017
ENTRYPOINT ["/usr/local/bin/start-mongo.sh"]
