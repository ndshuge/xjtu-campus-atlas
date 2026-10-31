// R17 provenance contract; documentary photos establish structure, never metric depth.
const allowedKinds=new Set(['official-photo','commons-photo','osm-footprint','measured-drawing','site-measurement']);
const documentary=new Set(['official-photo','commons-photo','osm-footprint']);
export function validateEvidence(entry){
 if(!entry||typeof entry!=='object')throw Error('evidence entry missing');
 for(const key of ['objectId','geomType','evidenceUri','license','capturedAt','coordSystem','elevationDatum','sourceKind','confidence','acceptedBy'])
  if(typeof entry[key]!=='string'||!entry[key].trim())throw Error('invalid '+key);
 if(!allowedKinds.has(entry.sourceKind))throw Error('invalid sourceKind');
 if('embeddedImage' in entry)throw Error('embeddedImage forbidden without separate licensed asset review');
 if(entry.measuredDepthM!==null&&entry.measuredDepthM!==undefined){
  if(documentary.has(entry.sourceKind)||!Number.isFinite(entry.measuredDepthM))throw Error('unsupported measuredDepthM');
 }
 return true;
}
export function validateLedger(ledger){
 if(!ledger||ledger.schema!=='r17-evidence-v1'||!Array.isArray(ledger.entries))throw Error('invalid ledger');
 ledger.entries.forEach(validateEvidence);
 return true;
}
