import yaml from "yaml";

export const createTraefikYmlConfig = (
  domain: string,
  port: string,
  ssl: boolean
) => {
  const traefikConfig = {
    log: {
      level: "ERROR",
      format: "json",
    },
    api: {
      insecure: true,
      dashboard: true,
      debug: true,
    },
    entryPoints: {
      web: {
        address: ":80",
        ...(ssl && {
          http: {
            redirections: {
              entryPoint: {
                to: "websecure",
                scheme: "https",
              },
            },
          },
        }),
      },
      ...(ssl && {
        websecure: {
          address: ":443",
          http: {
            tls: {
              certResolver: "acme-resolver",
              domains: [{ main: domain, sans: [`*.${domain}`] }],
            },
          },
        },
      }),
    },
    ...(ssl && {
      certificatesResolvers: {
        "acme-resolver": {
          acme: {
            email: "thanhduongbkdn2015@gmail.com",
            storage: "/acme.json",
            keyType: "EC384",
            dnsChallenge: {
              provider: "acme-dns",
            },
          },
        },
      },
    }),
    providers: {
      swarm: {
        exposedByDefault: false,
        endpoint: "unix:///var/run/docker.sock",
      },
      docker: {
        exposedByDefault: false,
        endpoint: "unix:///var/run/docker.sock",
      },
    },
    security: {
      headers: {
        customResponseHeaders: {
          "X-Forwarded-Proto": "https",
        },
        customRequestHeaders: {
          "X-Forwarded-Proto": "https",
        },
        sslProxyHeaders: {
          "X-Forwarded-Proto": "https",
        },
      },
    },
  };
  return yaml.stringify(traefikConfig);
};
