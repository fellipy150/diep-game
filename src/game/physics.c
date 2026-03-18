#include <math.h>

// Estrutura básica (mínima possível)
typedef struct {
    float x, y;
    float velX, velY;
    float radius;
} Body;

// --------------------------------------------------
// 🟢 DETECÇÃO DE COLISÃO (círculo vs círculo)
// --------------------------------------------------
int verificarColisao(Body* a, Body* b) {
    float dx = a->x - b->x;
    float dy = a->y - b->y;

    float rSum = a->radius + b->radius;

    return (dx * dx + dy * dy) < (rSum * rSum);
}

// --------------------------------------------------
// 🟢 RESOLVER SOBREPOSIÇÃO (separar objetos)
// --------------------------------------------------
void resolverSobreposicao(Body* a, Body* b) {
    float dx = a->x - b->x;
    float dy = a->y - b->y;

    float distSq = dx * dx + dy * dy;
    if (distSq == 0.0f) return;

    float dist = sqrtf(distSq);
    float minDist = a->radius + b->radius;

    if (dist >= minDist) return;

    float overlap = (minDist - dist) * 0.5f;

    float nx = dx / dist;
    float ny = dy / dist;

    a->x += nx * overlap;
    a->y += ny * overlap;

    b->x -= nx * overlap;
    b->y -= ny * overlap;
}

// --------------------------------------------------
// 🟢 APLICAR IMPULSO (tipo empurrão/knockback)
// --------------------------------------------------
void aplicarImpulso(Body* a, Body* b, float forca) {
    float dx = a->x - b->x;
    float dy = a->y - b->y;

    float distSq = dx * dx + dy * dy;
    if (distSq == 0.0f) return;

    float dist = sqrtf(distSq);

    float nx = dx / dist;
    float ny = dy / dist;

    // aplica força em direções opostas
    a->velX += nx * forca;
    a->velY += ny * forca;

    b->velX -= nx * forca;
    b->velY -= ny * forca;
}

// --------------------------------------------------
// 🟢 VERSÃO PLAYER vs INIMIGO (com duas forças)
// --------------------------------------------------
void aplicarImpulsoAssimetrico(Body* player, Body* enemy, float forcaEmpurrao, float forcaRecuo) {
    float dx = player->x - enemy->x;
    float dy = player->y - enemy->y;

    float distSq = dx * dx + dy * dy;
    if (distSq == 0.0f) return;

    float dist = sqrtf(distSq);

    float nx = dx / dist;
    float ny = dy / dist;

    // inimigo é empurrado
    enemy->velX -= nx * forcaEmpurrao;
    enemy->velY -= ny * forcaEmpurrao;

    // player sofre recuo
    player->velX += nx * forcaRecuo;
    player->velY += ny * forcaRecuo;
}
