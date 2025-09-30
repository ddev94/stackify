export const createTraefikDockerfileContent = () => {
  return `FROM traefik:v3
      WORKDIR /app
      COPY acme-dns /acme-dns
      COPY acme.json /acme.json
      COPY traefik.yml /traefik.yml
      RUN chmod 600 /acme.json
      EXPOSE 80
      EXPOSE 443`;
};
