// Contournement DNS SRV: conversion mongodb+srv:// -> mongodb:// seed list
const getMongoUri = () => {
  const originalUri = process.env.MONGO_URI;

  if (!originalUri) {
    return originalUri;
  }

  if (!originalUri.startsWith("mongodb+srv://")) {
    return originalUri;
  }

  const withoutScheme = originalUri.replace("mongodb+srv://", "");
  const atIndex = withoutScheme.indexOf("@");
  const slashIndex = withoutScheme.indexOf("/", atIndex + 1);

  if (atIndex === -1 || slashIndex === -1) {
    return originalUri;
  }

  const credentials = withoutScheme.slice(0, atIndex);
  const host = withoutScheme.slice(atIndex + 1, slashIndex);
  const pathAndQuery = withoutScheme.slice(slashIndex);

  const firstDot = host.indexOf(".");
  if (firstDot === -1) {
    return originalUri;
  }

  const clusterName = host.slice(0, firstDot);
  const domain = host.slice(firstDot + 1);
  const hosts = [
    `${clusterName}-shard-00-00.${domain}:27017`,
    `${clusterName}-shard-00-01.${domain}:27017`,
    `${clusterName}-shard-00-02.${domain}:27017`,
  ].join(",");

  const standardBase = `mongodb://${credentials}@${hosts}${pathAndQuery}`;
  const separator = standardBase.includes("?") ? "&" : "?";

  return `${standardBase}${separator}tls=true&authSource=admin`;
};

module.exports = { getMongoUri };
