import "./PageForm.css";
import {
  ChangeEvent,
  FC,
  FormEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import { Alert, Button, Form } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import LoadingOverlay from "../components/LoadingOverlay";
import { localAsset, toMediaUrl } from "../modules/media";
import type { AcidReaction, AcidReactionCreate } from "../modules/types";
import { ROUTES } from "../Routes";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import {
  clearReactionsError,
  createReaction,
  fetchDraft,
  publishReaction,
} from "../store/slices/reactionsSlice";

// Медиа по умолчанию для формы добавления (с учётом base сборки)
const defaultImage = localAsset("DefaultImage.svg");
const defaultVideo = localAsset("DefaultVideo.mp4");

// Шаг 1 — создание черновика, шаг 2 — публикация
type Step = "create" | "publish";

interface FormState {
  acid_name: string;
  description: string;
  molar_mass: string;
  concentration: string;
}

const initialState: FormState = {
  acid_name: "",
  description: "",
  molar_mass: "",
  concentration: "",
};

const AddReactionPage: FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const isAuthenticated = useAppSelector((state) => state.user.isAuthenticated);
  const { saving, error } = useAppSelector((state) => state.reactions);

  const pageRef = useRef<HTMLDivElement>(null);
  const [step, setStep] = useState<Step>("create");
  const [draft, setDraft] = useState<AcidReaction | null>(null);
  const [form, setForm] = useState<FormState>(initialState);
  const [localError, setLocalError] = useState<string | null>(null);
  const [loadingDraft, setLoadingDraft] = useState(true);

  // Превью медиа: по умолчанию показываем локальные ассеты.
  // Выбранные файлы храним как File и отправляем в multipart-запросе.
  const [imagePreview, setImagePreview] = useState(defaultImage);
  const [videoPreview, setVideoPreview] = useState(defaultVideo);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);

  // При открытии страницы ищем черновик пользователя:
  // если он есть — сразу показываем шаг публикации с заполненными полями.
  useEffect(() => {
    dispatch(clearReactionsError());

    if (!isAuthenticated) {
      navigate(ROUTES.LOGIN);
      return;
    }

    let cancelled = false;

    dispatch(fetchDraft())
      .unwrap()
      .then((draftItem) => {
        if (cancelled || !draftItem) return;

        setDraft(draftItem);
        setStep("publish");
        setForm({
          // Для старых черновиков, где заполнялось reaction_name,
          // показываем его как название кислоты.
          acid_name: draftItem.acid_name || draftItem.reaction_name,
          description: draftItem.description,
          molar_mass:
            draftItem.molar_mass > 0 ? String(draftItem.molar_mass) : "",
          concentration:
            draftItem.concentration > 0
              ? String(draftItem.concentration)
              : "",
        });
        setImagePreview(toMediaUrl(draftItem.image_url) || defaultImage);
        setVideoPreview(toMediaUrl(draftItem.video_url) || defaultVideo);
      })
      .finally(() => {
        if (!cancelled) setLoadingDraft(false);
      });

    return () => {
      cancelled = true;
    };
  }, [dispatch, isAuthenticated, navigate]);

  // При смене шага показываем начало страницы: заголовок и медиа
  useEffect(() => {
    if (pageRef.current) pageRef.current.scrollTop = 0;
  }, [step, loadingDraft]);

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // Читаем выбранный файл как data URL для превью
  const readFileAsDataUrl = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });

  // Выбор файла фото или видео с проверкой типа
  const handleMediaChange = async (
    e: ChangeEvent<HTMLInputElement>,
    kind: "image" | "video"
  ) => {
    const file = e.target.files?.[0];
    // Сбрасываем value, чтобы можно было выбрать тот же файл повторно
    e.target.value = "";
    if (!file) return;

    const expectedPrefix = kind === "image" ? "image/" : "video/";
    if (!file.type.startsWith(expectedPrefix)) {
      setLocalError(
        kind === "image"
          ? "Выберите файл изображения"
          : "Выберите файл видео"
      );
      return;
    }

    try {
      const dataUrl = await readFileAsDataUrl(file);
      setLocalError(null);

      if (kind === "image") {
        setImagePreview(dataUrl);
        setImageFile(file);
      } else {
        setVideoPreview(dataUrl);
        setVideoFile(file);
      }
    } catch {
      setLocalError("Не удалось прочитать выбранный файл");
    }
  };

  // Шаг 1: создаём черновик. Остальные поля заполняются при публикации.
  const handleCreateDraft = async (e: FormEvent) => {
    e.preventDefault();

    const acidName = form.acid_name.trim();
    if (!acidName) {
      setLocalError("Введите название кислоты");
      return;
    }

    setLocalError(null);

    const payload: AcidReactionCreate = {
      acid_name: acidName,
      description: "",
      molar_mass: 0,
      concentration: 0,
      image: imageFile,
      video: videoFile,
    };

    try {
      const created = await dispatch(createReaction(payload)).unwrap();
      setDraft(created);
      setForm((prev) => ({
        ...prev,
        acid_name: created.acid_name || created.reaction_name,
      }));
      setImagePreview(toMediaUrl(created.image_url) || defaultImage);
      setVideoPreview(toMediaUrl(created.video_url) || defaultVideo);
      setStep("publish");
    } catch (err) {
      setLocalError(
        typeof err === "string" ? err : "Не удалось создать черновик"
      );
    }
  };

  // Шаг 2: публикуем черновик, заполняя краткую информацию
  const handlePublish = async (e: FormEvent) => {
    e.preventDefault();

    if (!draft) {
      setLocalError("Черновик не найден");
      return;
    }

    // Поля публикации необязательные: можно оставить пустыми
    const description = form.description.trim();
    const molarMass = Math.max(0, Number(form.molar_mass) || 0);
    const concentration = Math.max(0, Number(form.concentration) || 0);

    setLocalError(null);

    try {
      await dispatch(
        publishReaction({
          id: draft.id,
          acid_name: (
            form.acid_name ||
            draft.acid_name ||
            draft.reaction_name
          ).trim(),
          description,
          molar_mass: molarMass,
          concentration,
        })
      ).unwrap();
      navigate(ROUTES.TILES);
    } catch (err) {
      setLocalError(
        typeof err === "string" ? err : "Не удалось опубликовать услугу"
      );
    }
  };

  return (
    <div className="formPage" ref={pageRef}>
      <h1 className="formTitle">Новая кислота</h1>

      {(localError || error) && (
        <Alert variant="danger" className="formError">
          {localError ?? error}
        </Alert>
      )}

      {/* Медиа по умолчанию: фото и видео друг под другом.
          На шаге создания кнопки открывают выбор файла. */}
      <div className="mediaPreviewList">
        <div className="mediaPreview">
          <img
            className="mediaPreviewContent"
            src={imagePreview}
            alt="Изображение реакции"
            onError={() => {
              if (imagePreview !== defaultImage) setImagePreview(defaultImage);
            }}
          />
          {step === "create" && (
            <label className="mediaPickBtn">
              Выбрать фото
              <input
                className="mediaPickInput"
                type="file"
                accept="image/*"
                onChange={(e) => handleMediaChange(e, "image")}
                disabled={saving}
              />
            </label>
          )}
        </div>

        <div className="mediaPreview">
          <video
            className="mediaPreviewContent"
            src={videoPreview}
            poster={defaultImage}
            autoPlay
            muted
            loop
            playsInline
            onError={() => {
              if (videoPreview !== defaultVideo) setVideoPreview(defaultVideo);
            }}
          />
          {step === "create" && (
            <label className="mediaPickBtn">
              Выбрать видео
              <input
                className="mediaPickInput"
                type="file"
                accept="video/*"
                onChange={(e) => handleMediaChange(e, "video")}
                disabled={saving}
              />
            </label>
          )}
        </div>
      </div>

      {step === "create" ? (
        <Form className="addFormCard" onSubmit={handleCreateDraft}>
          <Form.Group className="formGroup" controlId="acid_name">
            <Form.Label className="formLabel">Название кислоты</Form.Label>
            <Form.Control
              className="formControl"
              type="text"
              name="acid_name"
              value={form.acid_name}
              onChange={handleChange}
              placeholder="Например, Соляная кислота"
              disabled={saving}
            />
          </Form.Group>

          <p className="formHint">
            Нажмите «Далее», чтобы создать черновик. Остальные поля
            заполняются на этапе публикации.
          </p>

          <Button className="formSubmit" type="submit" disabled={saving}>
            Далее
          </Button>
        </Form>
      ) : (
        <Form className="addFormCard" onSubmit={handlePublish}>
          <Form.Group className="formGroup" controlId="description">
            <Form.Label className="formLabel">Описание</Form.Label>
            <Form.Control
              className="formControl"
              as="textarea"
              rows={3}
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Например, выделение CO2 при взаимодействии..."
              disabled={saving}
            />
          </Form.Group>

          <Form.Group className="formGroup" controlId="molar_mass">
            <Form.Label className="formLabel">Молярная масса, г/моль</Form.Label>
            <Form.Control
              className="formControl"
              type="number"
              min={0}
              step="0.01"
              name="molar_mass"
              value={form.molar_mass}
              onChange={handleChange}
              placeholder="0.00"
              disabled={saving}
            />
          </Form.Group>

          <Form.Group className="formGroup" controlId="concentration">
            <Form.Label className="formLabel">Концентрация, %</Form.Label>
            <Form.Control
              className="formControl"
              type="number"
              min={0}
              max={100}
              step="1"
              name="concentration"
              value={form.concentration}
              onChange={handleChange}
              placeholder="0"
              disabled={saving}
            />
          </Form.Group>

          <Button className="formSubmit" type="submit" disabled={saving}>
            Опубликовать
          </Button>
        </Form>
      )}

      <LoadingOverlay
        show={saving || loadingDraft}
        text={
          loadingDraft
            ? "Загрузка черновика..."
            : step === "create"
            ? "Создание черновика..."
            : "Публикация..."
        }
      />
    </div>
  );
};

export default AddReactionPage;
