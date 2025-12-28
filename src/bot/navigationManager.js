const menus = require('./menus');

/**
 * Gestor de navegación entre menús
 * Mantiene el estado de navegación de cada usuario
 */

class NavigationManager {
  constructor() {
    this.userStates = new Map();
  }

  /**
   * Inicializa el estado de un usuario
   */
  initUser(userId) {
    if (!this.userStates.has(userId)) {
      this.userStates.set(userId, {
        navigationStack: ['principal'],
        currentMenu: 'principal',
        context: {},
        lastActivity: Date.now()
      });
    }
    return this.getUserState(userId);
  }

  /**
   * Obtiene el estado actual de un usuario
   */
  getUserState(userId) {
    return this.userStates.get(userId) || this.initUser(userId);
  }

  /**
   * Navega a un nuevo menú
   */
  navigate(userId, menuId, context = {}) {
    const state = this.getUserState(userId);
    
    state.navigationStack.push(menuId);
    state.currentMenu = menuId;
    state.context = { ...state.context, ...context };
    state.lastActivity = Date.now();

    this.userStates.set(userId, state);
    
    return this.getCurrentMenu(userId);
  }

  /**
   * Vuelve al menú anterior
   */
  goBack(userId) {
    const state = this.getUserState(userId);
    
    if (state.navigationStack.length > 1) {
      state.navigationStack.pop();
      state.currentMenu = state.navigationStack[state.navigationStack.length - 1];
      
      if (state.currentMenu !== 'detalle_procedimiento') {
        delete state.context.procedimientoActual;
      }
      
      state.lastActivity = Date.now();
      this.userStates.set(userId, state);
    }
    
    return this.getCurrentMenu(userId);
  }

  /**
   * Resetea al menú principal
   */
  reset(userId) {
    this.userStates.set(userId, {
      navigationStack: ['principal'],
      currentMenu: 'principal',
      context: {},
      lastActivity: Date.now()
    });
    
    return this.getCurrentMenu(userId);
  }

  /**
   * Obtiene el menú actual del usuario
   */
  getCurrentMenu(userId) {
    const state = this.getUserState(userId);
    const menuId = state.currentMenu;

    switch(menuId) {
      case 'principal':
        return menus.getMenuPrincipal();
      
      case 'procedimientos':
        return menus.getMenuProcedimientos();
      
      case 'detalle_procedimiento':
        const procId = state.context.procedimientoActual;
        return menus.getMenuDetalleProcedimiento(procId);
      
      case 'formularios':
        return menus.getMenuFormularios();
      
      default:
        return menus.getMenuPrincipal();
    }
  }

  /**
   * Procesa la opción seleccionada por el usuario
   */
  processOption(userId, opcion) {
    const state = this.getUserState(userId);
    const currentMenu = this.getCurrentMenu(userId);

    if (opcion.toLowerCase() === 'menu') {
      return {
        action: 'navigate',
        menu: this.reset(userId)
      };
    }

    if (opcion === '0') {
      return {
        action: 'navigate',
        menu: this.goBack(userId)
      };
    }

    if (!currentMenu.opciones || !currentMenu.opciones[opcion]) {
      return {
        action: 'invalid',
        message: '❌ Opción no válida. Por favor selecciona una opción del menú.'
      };
    }

    const targetOption = currentMenu.opciones[opcion];

    switch(targetOption) {
      case 'chatbot':
        return {
          action: 'start_ia',
          message: '🤖 *Asistente IA Activado*\n\nPuedes hacerme cualquier pregunta. Escribe *menu* cuando quieras volver.'
        };

      case 'procedimientos':
        return {
          action: 'navigate',
          menu: this.navigate(userId, 'procedimientos')
        };

      case 'formularios':
        return {
          action: 'navigate',
          menu: this.navigate(userId, 'formularios')
        };

      case 'directorio':
        return {
          action: 'info',
          message: '📞 *Directorio Telefónico*\n\nEsta sección estará disponible próximamente.\n\nEscribe *menu* para volver.'
        };

      case 'volver':
        return {
          action: 'navigate',
          menu: this.goBack(userId)
        };

      case 'ver_video':
        return {
          action: 'send_video',
          procedimientoId: state.context.procedimientoActual
        };

      case 'ver_documento':
        return {
          action: 'send_documento',
          procedimientoId: state.context.procedimientoActual
        };

      case 'consulta_ia':
        return {
          action: 'start_consulta_ia',
          procedimientoId: state.context.procedimientoActual,
          message: '💬 *Modo Consulta Activado*\n\nEscribe tu pregunta sobre este procedimiento.\n\nEscribe *volver* para regresar al menú anterior.'
        };

      default:
        const proc = menus.getProcedimiento(targetOption);
        if (proc) {
          return {
            action: 'navigate',
            menu: this.navigate(userId, 'detalle_procedimiento', {
              procedimientoActual: proc.id
            })
          };
        }

        return {
          action: 'invalid',
          message: '❌ Opción no reconocida.'
        };
    }
  }

  /**
   * Limpia estados de usuarios inactivos
   */
  cleanInactiveUsers() {
    const oneHour = 60 * 60 * 1000;
    const now = Date.now();

    for (const [userId, state] of this.userStates.entries()) {
      if (now - state.lastActivity > oneHour) {
        this.userStates.delete(userId);
      }
    }
  }
}

const navigationManager = new NavigationManager();

setInterval(() => {
  navigationManager.cleanInactiveUsers();
}, 30 * 60 * 1000);

module.exports = navigationManager;