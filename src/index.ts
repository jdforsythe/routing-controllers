import {importClassesFromDirectories} from "./util/importClassesFromDirectories";
import {RoutingControllers} from "./RoutingControllers";
import {ExpressDriver} from "./driver/express/ExpressDriver";
import {KoaDriver} from "./driver/koa/KoaDriver";
import {Driver} from "./driver/Driver";
import {RoutingControllersOptions} from "./RoutingControllersOptions";
import {CustomParameterDecorator} from "./CustomParameterDecorator";
import {defaultMetadataArgsStorage} from "./metadata-builder/MetadataArgsStorage";

// -------------------------------------------------------------------------
// Main exports
// -------------------------------------------------------------------------

export * from "./container";

export * from "./decorator/Body";
export * from "./decorator/BodyParam";
export * from "./decorator/ContentType";
export * from "./decorator/Controller";
export * from "./decorator/CookieParam";
export * from "./decorator/Delete";
export * from "./decorator/Get";
export * from "./decorator/Head";
export * from "./decorator/Header";
export * from "./decorator/HeaderParam";
export * from "./decorator/HttpCode";
export * from "./decorator/Location";
export * from "./decorator/Method";
export * from "./decorator/Middleware";
export * from "./decorator/OnNull";
export * from "./decorator/OnUndefined";
export * from "./decorator/Param";
export * from "./decorator/Patch";
export * from "./decorator/Post";
export * from "./decorator/Put";
export * from "./decorator/QueryParam";
export * from "./decorator/Redirect";
export * from "./decorator/Render";
export * from "./decorator/Req";
export * from "./decorator/Res";
export * from "./decorator/ResponseClassTransformOptions";
export * from "./decorator/Session";
export * from "./decorator/State";
export * from "./decorator/UploadedFile";
export * from "./decorator/UploadedFiles";
export * from "./decorator/UseAfter";
export * from "./decorator/UseBefore";
export * from "./decorator/UploadedFiles";
export * from "./decorator/JsonController";

export * from "./http-error/HttpError";
export * from "./http-error/InternalServerError";
export * from "./http-error/BadRequestError";
export * from "./http-error/ForbiddenError";
export * from "./http-error/NotAcceptableError";
export * from "./http-error/MethodNotAllowedError";
export * from "./http-error/NotFoundError";
export * from "./http-error/UnauthorizedError";

export * from "./driver/express/ExpressMiddlewareInterface";
export * from "./driver/express/ExpressErrorMiddlewareInterface";
export * from "./driver/koa/KoaMiddlewareInterface";

export * from "./RoutingControllersOptions";
export * from "./CustomParameterDecorator";

// -------------------------------------------------------------------------
// Main Functions
// -------------------------------------------------------------------------

/**
 * Registers all loaded actions in your express application.
 */
export function useExpressServer<T>(expressApp: T, options?: RoutingControllersOptions): T {
    createExecutor(new ExpressDriver(expressApp), options || {});
    return expressApp;
}

/**
 * Registers all loaded actions in your express application.
 */
export function createExpressServer(options?: RoutingControllersOptions): any {
    const driver = new ExpressDriver();
    createExecutor(driver, options || {});
    return driver.express;
}

/**
 * Registers all loaded actions in your koa application.
 */
export function useKoaServer<T>(koaApp: T, options?: RoutingControllersOptions): T {
    createExecutor(new KoaDriver(koaApp), options || {});
    return koaApp;
}

/**
 * Registers all loaded actions in your koa application.
 */
export function createKoaServer(options?: RoutingControllersOptions): any {
    const driver = new KoaDriver();
    createExecutor(driver, options || {});
    return driver.koa;
}

/**
 * Registers all loaded actions in your express application.
 */
function createExecutor(driver: Driver, options: RoutingControllersOptions): void {

    // import all controllers and middlewares and error handlers (new way)
    let controllerClasses: Function[];
    if (options && options.controllers && options.controllers.length) {
        controllerClasses = (options.controllers as any[]).filter(controller => controller instanceof Function);
        const controllerDirs = (options.controllers as any[]).filter(controller => typeof controller === "string");
        controllerClasses.push(...importClassesFromDirectories(controllerDirs));
    }
    let middlewareClasses: Function[];
    if (options && options.middlewares && options.middlewares.length) {
        middlewareClasses = (options.middlewares as any[]).filter(controller => controller instanceof Function);
        const middlewareDirs = (options.middlewares as any[]).filter(controller => typeof controller === "string");
        middlewareClasses.push(...importClassesFromDirectories(middlewareDirs));
    }
    if (options && options.middlewares && options.middlewares.length)

    if (options && options.development !== undefined) {
        driver.developmentMode = options.development;
    } else {
        driver.developmentMode = process.env.NODE_ENV !== "production";
    }

    if (options.defaultErrorHandler !== undefined) {
        driver.isDefaultErrorHandlingEnabled = options.defaultErrorHandler;
    } else {
        driver.isDefaultErrorHandlingEnabled = true;
    }

    if (options.classTransformer !== undefined) {
        driver.useClassTransformer = options.classTransformer;
    } else {
        driver.useClassTransformer = true;
    }

    if (options.validator !== undefined) {
        driver.enableValidation = !!options.validator;
        if (options.validator instanceof Object)
            driver.validationOptions = options.validator;

    } else {
        driver.enableValidation = false;
    }

    driver.classToPlainTransformOptions = options.classToPlainTransformOptions;
    driver.plainToClassTransformOptions = options.plainToClassTransformOptions;

    if (options.errorOverridingMap !== undefined)
        driver.errorOverridingMap = options.errorOverridingMap;

    if (options.routePrefix !== undefined)
        driver.routePrefix = options.routePrefix;

    if (options.currentUserChecker !== undefined)
        driver.currentUserChecker = options.currentUserChecker;

    if (options.authorizationChecker !== undefined)
        driver.authorizationChecker = options.authorizationChecker;

    // next create a controller executor
    new RoutingControllers(driver)
        .initialize()
        .registerMiddlewares("before")
        .registerControllers(controllerClasses)
        .registerMiddlewares("after", middlewareClasses); // todo: register only for loaded controllers?
}

/**
 * Registers custom parameter decorator used in the controller actions.
 */
export function registerParamDecorator(options: CustomParameterDecorator) {
    defaultMetadataArgsStorage.params.push({
        type: "custom-converter",
        object: options.object,
        method: options.method,
        index: options.index,
        parse: false,
        required: options.required,
        transform: options.value
    });
}