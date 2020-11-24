precision highp float;
attribute vec3 position;
attribute vec3 normal;
uniform mat3 normalMatrix;
uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;
varying vec3 fNormal;
varying vec3 fPosition;

varying vec3 posDiscard;

varying float speed;
uniform float time;
const float pi=3.1415926535;

vec3 twist(vec3 vec_in, float angle) {
  vec3 vec_out = vec_in;
  vec_out.y = cos(angle)*vec_in.y - sin(angle)*vec_in.z;
  // vec_out.x = cos(angle)*vec_in.x - sin(angle)*vec_in.z;
  // vec_out.z = sin(angle)*vec_in.x + cos(angle)*vec_in.z;
  return vec_out;
}

void main()
{
  float speed = 70.0;
  float ridiculousness = 0.05;
  posDiscard = position;
  vec3 twistedPos = twist(position, ridiculousness*pi*position.y*sin(speed*time));
  vec3 twistedNormal = twist(normal, ridiculousness*pi*position.y*sin(speed*time));
  
  fNormal = normalize(normalMatrix * twistedNormal);
  vec4 pos = modelViewMatrix * vec4(twistedPos, 1.0);
  fPosition = pos.xyz;
  gl_Position = projectionMatrix * pos;
}






precision highp float;
varying vec3 fPosition;
varying vec3 fNormal;
varying vec3 posDiscard;
uniform float time;
const float pi = 3.1415926535;

// reusable components
vec3 s, v, n, h;

const vec3 objColor = vec3(0.6, 0.56, 0.4);

// ambient/diffuse light constants
const vec3 lightDir1 = vec3(-1.0, 1.0, 0.5);
const float lightInt = 1.0;
const float ambiInt = 0.06;
const float diffuInt = 0.9;

// specular light 1 constants
const vec3 lightColor1 = vec3(0.0, 0.0, 1.0);
const float specInt1 = 2.0;
const float focus1 = 256.0;

// specular light 2 constants
const vec3 lightColor2 = vec3(0.0, 1.0, 0.1);
const float specInt2 = 2.0;
const float focus2 = 256.0;

void updateVec(vec3 lightDir) {
  s = normalize(lightDir);
  v = normalize(-fPosition);
  n = normalize(fNormal);
  h = normalize(v+s);
}

float getAmbiDiffu(vec3 lightDir, float lightInt, float ambiInt, float diffuInt) { 
  updateVec(lightDir);
  return ambiInt + diffuInt * lightInt * max(0.0, dot(n, s));
}

float getSpecular(vec3 lightDir, float specColor, float focus) { 
  updateVec(lightDir); 
  return specColor * pow(max(0.0, dot(n, h)), focus);
}


void main(){
  float angle = 100.0 * time;
  
  // passing specular light directions
  vec3 lightDirS1 = vec3(1.0, sin(angle), cos(angle));
  vec3 lightDirS2 = vec3(-1.0, sin(angle), cos(angle));
  vec3 lightDirS3 = vec3(1.0, sin(angle+pi/3.0), cos(angle+pi/3.0));
  vec3 lightDirS4 = vec3(-1.0, sin(angle+pi/3.0), cos(angle+pi/3.0));
  vec3 lightDirS5 = vec3(1.0, sin(angle+pi/3.0*2.0), cos(angle+pi/3.0*2.0));
  vec3 lightDirS6 = vec3(-1.0, sin(angle+pi/3.0*2.0), cos(angle+pi/3.0*2.0));

  vec3 colorAmbiDiffu = getAmbiDiffu(lightDir1, lightInt, ambiInt, diffuInt)*objColor;
  vec3 colorSpec1 = getSpecular(lightDirS1, specInt1, focus1)*lightColor1;
  vec3 colorSpec2 = getSpecular(lightDirS2, specInt2, focus2)*lightColor2;
  vec3 colorSpec3 = getSpecular(lightDirS3, specInt1, focus1)*lightColor1;
  vec3 colorSpec4 = getSpecular(lightDirS4, specInt2, focus2)*lightColor2;
  vec3 colorSpec5 = getSpecular(lightDirS5, specInt1, focus1)*lightColor1;
  vec3 colorSpec6 = getSpecular(lightDirS6, specInt2, focus2)*lightColor2;
  
  vec3 colorComposite = colorAmbiDiffu + colorSpec1 + colorSpec2 + colorSpec3 + colorSpec4 + colorSpec5 + colorSpec6;
  gl_FragColor = vec4(colorComposite, 1.0);
  
  if (cos(100.0*posDiscard.y) > 0.999) discard;
}
