import { BehaviorSubject, map, Observable } from 'rxjs';
import { DataTypeEntity } from '../../mocks/data/content.data';

export class UmbDataTypeStore {
  private _dataTypes: BehaviorSubject<Array<DataTypeEntity>> = new BehaviorSubject(<Array<DataTypeEntity>>[]);
  public readonly dataTypes: Observable<Array<DataTypeEntity>> = this._dataTypes.asObservable();

  constructor() {
    this._dataTypes.next([
      {
        id: 1245,
        key: 'dt-1',
        name: 'TextString (DataType)',
        propertyEditorUIAlias: 'Umb.PropertyEditorUI.Text',
      },
      {
        id: 1244,
        key: 'dt-2',
        name: 'Textarea (DataType)',
        propertyEditorUIAlias: 'Umb.PropertyEditorUI.Textarea',
      },
      {
        id: 1246,
        key: 'dt-3',
        name: 'My JS Property Editor (DataType)',
        propertyEditorUIAlias: 'My.PropertyEditorUI.Custom',
      },
      {
        id: 1247,
        key: 'dt-4',
        name: 'Context Example (DataType)',
        propertyEditorUIAlias: 'Umb.PropertyEditorUI.ContextExample',
      },
    ]);
  }

  getById(id: number): Observable<DataTypeEntity | null> {
    // no fetch..

    // TODO: make pipes prettier/simpler/reuseable
    return this.dataTypes.pipe(
      map((dataTypes: Array<DataTypeEntity>) => dataTypes.find((node: DataTypeEntity) => node.id === id) || null)
    );
  }

  getByKey(key: string): Observable<DataTypeEntity | null> {
    // no fetch..

    // TODO: make pipes prettier/simpler/reuseable
    return this.dataTypes.pipe(
      map((dataTypes: Array<DataTypeEntity>) => dataTypes.find((node: DataTypeEntity) => node.key === key) || null)
    );
  }
}
