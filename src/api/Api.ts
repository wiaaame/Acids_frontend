/* eslint-disable */
/* tslint:disable */
// @ts-nocheck
/*
 * ---------------------------------------------------------------
 * ## THIS FILE WAS GENERATED VIA SWAGGER-TYPESCRIPT-API        ##
 * ##                                                           ##
 * ## AUTHOR: acacode                                           ##
 * ## SOURCE: https://github.com/acacode/swagger-typescript-api ##
 * ---------------------------------------------------------------
 */

export interface InternalApiAcidDTO {
  acid_formula?: string;
  acid_name?: string;
  calcium_carbonate_mass?: number;
  completed_at?: string;
  concentration?: number;
  created_at?: string;
  creator_name?: string;
  description?: string;
  id?: number;
  image_key?: string;
  image_url?: string;
  is_mine?: number;
  like_count?: number;
  liked?: number;
  moderator_id?: number;
  molar_mass?: number;
  published_at?: string;
  reaction_name?: string;
  status?: string;
  video_key?: string;
  video_url?: string;
}

export interface InternalApiErrorResponse {
  error?: string;
}

export interface InternalApiLikeRequest {
  value?: number;
}

export interface InternalApiLoginRequest {
  password?: string;
  username?: string;
}

export interface InternalApiLoginResponse {
  access_token?: string;
  /** профиль — автозаполнение creator_id */
  current_user?: InternalApiUserDTO;
  /** секунд до истечения */
  expires_in?: number;
  /** ид токена (ключ blacklist'а) */
  jti?: string;
  message?: string;
  token_type?: string;
}

export interface InternalApiUserDTO {
  created_at?: string;
  email?: string;
  id?: number;
  username?: string;
}

import type {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  HeadersDefaults,
  ResponseType,
} from "axios";
import axios from "axios";

export type QueryParamsType = Record<string | number, any>;

export interface FullRequestParams
  extends Omit<AxiosRequestConfig, "data" | "params" | "url" | "responseType"> {
  /** set parameter to `true` for call `securityWorker` for this request */
  secure?: boolean;
  /** request path */
  path: string;
  /** content type of request body */
  type?: ContentType;
  /** query params */
  query?: QueryParamsType;
  /** format of response (i.e. response.json() -> format: "json") */
  format?: ResponseType;
  /** request body */
  body?: unknown;
}

export type RequestParams = Omit<
  FullRequestParams,
  "body" | "method" | "query" | "path"
>;

export interface ApiConfig<SecurityDataType = unknown>
  extends Omit<AxiosRequestConfig, "data" | "cancelToken"> {
  securityWorker?: (
    securityData: SecurityDataType | null,
  ) => Promise<AxiosRequestConfig | void> | AxiosRequestConfig | void;
  secure?: boolean;
  format?: ResponseType;
}

export enum ContentType {
  Json = "application/json",
  JsonApi = "application/vnd.api+json",
  FormData = "multipart/form-data",
  UrlEncoded = "application/x-www-form-urlencoded",
  Text = "text/plain",
}

export class HttpClient<SecurityDataType = unknown> {
  public instance: AxiosInstance;
  private securityData: SecurityDataType | null = null;
  private securityWorker?: ApiConfig<SecurityDataType>["securityWorker"];
  private secure?: boolean;
  private format?: ResponseType;

  constructor({
    securityWorker,
    secure,
    format,
    ...axiosConfig
  }: ApiConfig<SecurityDataType> = {}) {
    this.instance = axios.create({
      ...axiosConfig,
      baseURL: axiosConfig.baseURL || "http://localhost:8080",
    });
    this.secure = secure;
    this.format = format;
    this.securityWorker = securityWorker;
  }

  public setSecurityData = (data: SecurityDataType | null) => {
    this.securityData = data;
  };

  protected mergeRequestParams(
    params1: AxiosRequestConfig,
    params2?: AxiosRequestConfig,
  ): AxiosRequestConfig {
    const method = params1.method || (params2 && params2.method);

    return {
      ...this.instance.defaults,
      ...params1,
      ...(params2 || {}),
      headers: {
        ...((method &&
          this.instance.defaults.headers[
            method.toLowerCase() as keyof HeadersDefaults
          ]) ||
          {}),
        ...(params1.headers || {}),
        ...((params2 && params2.headers) || {}),
      },
    };
  }

  protected stringifyFormItem(formItem: unknown) {
    if (typeof formItem === "object" && formItem !== null) {
      return JSON.stringify(formItem);
    } else {
      return `${formItem}`;
    }
  }

  protected createFormData(input: Record<string, unknown>): FormData {
    if (input instanceof FormData) {
      return input;
    }
    return Object.keys(input || {}).reduce((formData, key) => {
      const property = input[key];
      const propertyContent: any[] =
        property instanceof Array ? property : [property];

      for (const formItem of propertyContent) {
        const isFileType = formItem instanceof Blob || formItem instanceof File;
        formData.append(
          key,
          isFileType ? formItem : this.stringifyFormItem(formItem),
        );
      }

      return formData;
    }, new FormData());
  }

  public request = async <T = any, _E = any>({
    secure,
    path,
    type,
    query,
    format,
    body,
    ...params
  }: FullRequestParams): Promise<AxiosResponse<T>> => {
    const secureParams =
      ((typeof secure === "boolean" ? secure : this.secure) &&
        this.securityWorker &&
        (await this.securityWorker(this.securityData))) ||
      {};
    const requestParams = this.mergeRequestParams(params, secureParams);
    const responseFormat = format || this.format || undefined;

    if (
      type === ContentType.FormData &&
      body &&
      body !== null &&
      typeof body === "object"
    ) {
      body = this.createFormData(body as Record<string, unknown>);
    }

    if (
      type === ContentType.Text &&
      body &&
      body !== null &&
      typeof body !== "string"
    ) {
      body = JSON.stringify(body);
    }

    return this.instance.request({
      ...requestParams,
      headers: {
        ...(requestParams.headers || {}),
        ...(type ? { "Content-Type": type } : {}),
      },
      params: query,
      responseType: responseFormat,
      data: body,
      url: path,
    });
  };
}

/**
 * @title Веб-сервис «Услуги кислот» (бэкенд SPA)
 * @version 4.0
 * @termsOfService http://example.com/terms
 * @baseUrl http://localhost:8080
 * @contact ИИС-23, группа <student@example.com>
 *
 * Лабораторная работа 4: JWT-аутентификация (HS256), отзыв токенов через blacklist в Redis, автозаполнение creator_id, Swagger-документация методов.
 * Без авторизации доступно только чтение (GET /api/acids, GET /api/feed). Методы создателя (черновик, создание, публикация, удаление, лайк, logout) требуют заголовок Authorization: Bearer <JWT>.
 */
export class Api<
  SecurityDataType extends unknown,
> extends HttpClient<SecurityDataType> {
  api = {
    /**
     * @description Публичное чтение. Список опубликованных услуг с фильтрацией на бэкенде (?min, ?max, ?acid_name, ?acid_formula, ?reaction_name) и признаком is_mine. Работает без токена (гость: is_mine=0, liked=0); при наличии Authorization: Bearer <JWT> признаки считаются для этого пользователя.
     *
     * @tags Услуга
     * @name AcidsList
     * @summary Список услуг (плитка)
     * @request GET:/api/acids
     */
    acidsList: (
      query?: {
        /** Мин. молярная масса (г/моль) */
        min?: number;
        /** Макс. молярная масса (г/моль) */
        max?: number;
        /** Подстрока названия кислоты */
        acid_name?: string;
        /** Подстрока формулы */
        acid_formula?: string;
        /** Подстрока названия реакции */
        reaction_name?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<InternalApiAcidDTO[], InternalApiErrorResponse>({
        path: `/api/acids`,
        method: "GET",
        query: query,
        format: "json",
        ...params,
      }),

    /**
     * @description Метод создателя. Создаёт/обновляет черновик (status=draft) с полями и файлами image (до 5 МБ), video (до 100 МБ). creator_id подставляется из JWT автоматически.
     *
     * @tags Услуга
     * @name AcidsCreate
     * @summary Добавить услугу (черновик)
     * @request POST:/api/acids
     * @secure
     */
    acidsCreate: (
      data: {
        /** Название реакции */
        reaction_name?: string;
        /** Название кислоты */
        acid_name?: string;
        /** Формула кислоты */
        acid_formula?: string;
        /** Молярная масса, г/моль */
        molar_mass?: number;
        /** Концентрация, % */
        concentration?: number;
        /** Масса карбоната кальция, г */
        calcium_carbonate_mass?: number;
        /** Описание */
        description?: string;
        /**
         * Изображение (.jpg/.png/.gif/.webp)
         * @format binary
         */
        image?: File;
        /**
         * Видео (.mp4/.webm/.mov)
         * @format binary
         */
        video?: File;
      },
      params: RequestParams = {},
    ) =>
      this.request<InternalApiAcidDTO, InternalApiErrorResponse>({
        path: `/api/acids`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.FormData,
        format: "json",
        ...params,
      }),

    /**
     * @description Метод создателя. Черновик (status=draft) пользователя из JWT, не более одной записи; ид не указывается.
     *
     * @tags Услуга
     * @name AcidsDraftList
     * @summary Черновик текущего пользователя
     * @request GET:/api/acids/draft
     * @secure
     */
    acidsDraftList: (params: RequestParams = {}) =>
      this.request<InternalApiAcidDTO, InternalApiErrorResponse>({
        path: `/api/acids/draft`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Метод создателя. Статус услуги владельца меняется на deleted; из API удалённые записи не возвращаются.
     *
     * @tags Услуга
     * @name AcidsDelete
     * @summary Удалить услугу (soft delete)
     * @request DELETE:/api/acids/{id}
     * @secure
     */
    acidsDelete: (id: number, params: RequestParams = {}) =>
      this.request<Record<string, any>, InternalApiErrorResponse>({
        path: `/api/acids/${id}`,
        method: "DELETE",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Метод зарегистрированного пользователя (JWT). value=1 — лайк, value=0 — снять. Ответ: liked 0/1 и общий like_count.
     *
     * @tags Услуга
     * @name AcidsLikeCreate
     * @summary Лайк услуги
     * @request POST:/api/acids/{id}/like
     * @secure
     */
    acidsLikeCreate: (
      id: number,
      body: InternalApiLikeRequest,
      params: RequestParams = {},
    ) =>
      this.request<Record<string, any>, InternalApiErrorResponse>({
        path: `/api/acids/${id}/like`,
        method: "POST",
        body: body,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Метод создателя. Переводит черновик (draft) в опубликованную (published), заполняет published_at. Токен задаёт создателя: чужая услуга недоступна (404).
     *
     * @tags Услуга
     * @name AcidsPublishUpdate
     * @summary Опубликовать услугу
     * @request PUT:/api/acids/{id}/publish
     * @secure
     */
    acidsPublishUpdate: (id: number, params: RequestParams = {}) =>
      this.request<InternalApiAcidDTO, InternalApiErrorResponse>({
        path: `/api/acids/${id}/publish`,
        method: "PUT",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Публичное чтение. Одна запись: без параметров — первая; ?id=N — по ид; ?id=N&next=true — следующая (циклически). Опциональный токен задаёт признак liked.
     *
     * @tags Услуга
     * @name FeedList
     * @summary Лента опубликованных услуг
     * @request GET:/api/feed
     */
    feedList: (
      query?: {
        /** Ид услуги */
        id?: number;
        /** Следующая после id (true) */
        next?: boolean;
      },
      params: RequestParams = {},
    ) =>
      this.request<InternalApiAcidDTO, InternalApiErrorResponse>({
        path: `/api/feed`,
        method: "GET",
        query: query,
        format: "json",
        ...params,
      }),

    /**
     * @description Проверяет логин и пароль (bcrypt). Успех — access-токен JWT (HS256) и профиль. Токен передаётся в заголовке Authorization: Bearer <JWT> методам создателя и необязательно чтению.
     *
     * @tags Пользователь
     * @name UsersLoginCreate
     * @summary Аутентификация (вход)
     * @request POST:/api/users/login
     */
    usersLoginCreate: (
      body: InternalApiLoginRequest,
      params: RequestParams = {},
    ) =>
      this.request<InternalApiLoginResponse, InternalApiErrorResponse>({
        path: `/api/users/login`,
        method: "POST",
        body: body,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Добавляет jti текущего JWT в blacklist Redis (TTL = остаток жизни токена). Требует заголовок Authorization: Bearer <JWT>.
     *
     * @tags Пользователь
     * @name UsersLogoutCreate
     * @summary Выход (отзыв токена)
     * @request POST:/api/users/logout
     * @secure
     */
    usersLogoutCreate: (params: RequestParams = {}) =>
      this.request<Record<string, any>, InternalApiErrorResponse>({
        path: `/api/users/logout`,
        method: "POST",
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

  };
}
