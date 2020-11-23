// NOTE: VERTEX
precision highp float;
attribute vec3 position;
attribute vec3 normal;
uniform mat3 normalMatrix;
uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;
varying vec3 fNormal;

varying vec3 fPosition;

void main()
{
  fNormal = normalize(normalMatrix * normal);
  vec4 pos = modelViewMatrix * vec4(position, 1.0);
  fPosition = pos.xyz;
  gl_Position = projectionMatrix * pos;
}




// NOTE: FRAGMENT
precision highp float;
varying vec3 fPosition;
varying vec3 fNormal;

uniform float time;
const float pi = 3.1415926535;

// reusable components
vec3 s, v, n, h;

const vec3 lightColor = vec3(1.0, 1.0, 1.0);
const vec3 objColor = vec3(0.0, 0.6, 0.7);

// specular light 1 constants
const vec3 lightDir1 = vec3(0.0, 1.0, 0.0);   // stationary light?????
const float specColor1 = 1.0;               // stationary light?????
const float focus1 = 64.0;                  // I bet it is stationary

// specular light 2 constants
const float focus2 = 64.0;
float lightDir2;

// ambient/diffuse light constants
const float lightI = 1.0;                   // WTF? used by ambient/diffuse calculation
const float ambiColor = 0.15;            // how to use?
const float diffuColor = 0.7;             // how to use?

void updateVec(vec3 lightDir) {
  s = normalize(lightDir);
  v = normalize(-fPosition);
  n = normalize(fNormal);
  h = normalize(v+s);
}

float getAmbiDiffu(vec3 lightDir, float lightInt, float ambient, float diffuColor) { 
  updateVec(lightDir);
  return ambient + diffuColor * lightInt * max(0.0, dot(n, s));
}

float getSpecular(vec3 lightDir, float specColor, float focus) { 
  updateVec(lightDir); 
  return specColor * pow(max(0.0, dot(n, h)), focus);
}


void main(){
  // float angle = 1.0*pi;               // TODO: to be timed
  float angle = 20.0 * time;
  
  float specColor2 = 0.7;
  
  // adjustable light parameters
  vec3 lightDir2 = vec3(sin(angle), 1.0, cos(angle));
  
  vec3 colorSpec1 = getSpecular(lightDir1, specColor1, focus1)*lightColor;
  vec3 colorSpec2 = getSpecular(lightDir2, specColor2, focus2)*lightColor;
  vec3 colorAmbiDiffu = getAmbiDiffu(lightDir1, lightI, ambiColor, diffuColor)*objColor;
  
  gl_FragColor = vec4(colorAmbiDiffu + colorSpec1 + colorSpec2, 1.0);
}
