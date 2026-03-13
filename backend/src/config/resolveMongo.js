// Résolution manuelle de l'URI MongoDB pour contourner les problèmes DNS SRV
const dns = require('dns').promises;

async function resolveMongoUri(uri) {
  // Si ce n'est pas une URI SRV, retourner telle quelle
  if (!uri.startsWith('mongodb+srv://')) {
    return uri;
  }

  console.log('🔄 Conversion de l\'URI SRV en URI standard...');

  // Extraire les parties de l'URI
  const match = uri.match(/mongodb\+srv:\/\/([^:]+):([^@]+)@([^/]+)\/(.+)/);
  if (!match) {
    console.error('Format d\'URI invalide');
    return uri;
  }

  const [, username, password, host, rest] = match;
  
  // Hostnames connus du cluster Atlas (pattern standard)
  const clusterName = host.split('.')[0]; // cluster0
  const domain = host.substring(host.indexOf('.') + 1); // nks2d.mongodb.net
  
  // Construction de l'URI standard avec les hostnames du replica set
  const replicaSetHosts = [
    `${clusterName}-shard-00-00.${domain}:27017`,
    `${clusterName}-shard-00-01.${domain}:27017`,
    `${clusterName}-shard-00-02.${domain}:27017`
  ].join(',');

  // Extraire le nom de la base de données et les paramètres
  const dbAndParams = rest.split('?');
  const dbName = dbAndParams[0];
  const params = dbAndParams[1] || '';

  // Construire l'URI standard
  const standardUri = `mongodb://${username}:${password}@${replicaSetHosts}/${dbName}?ssl=true&replicaSet=atlas-${clusterName.replace('cluster', '')}-shard-0&authSource=admin&${params}`;

  console.log('URI convertie en format standard');
  return standardUri;
}

module.exports = { resolveMongoUri };
